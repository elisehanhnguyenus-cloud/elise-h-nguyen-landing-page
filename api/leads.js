import { put } from '@vercel/blob';
import { isAllowedOrigin, rateLimiter, firstForwardedIp } from './_guard.js';

// ============================================================
// /api/leads — nhận form liên hệ → Notion (+ file đính kèm → Vercel Blob)
// Bảo vệ: chỉ nhận từ chính website (Origin), honeypot chống bot,
// giới hạn tần suất theo IP, validate dữ liệu, allowlist loại file.
// ============================================================

const DATABASE_ID = process.env.NOTION_DATABASE_ID || '3308ed608af9804c8401c5599ef4f556';
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ALLOWED_EXT = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
const isRateLimited = rateLimiter('leads', 5, 10 * 60 * 1000);

// Chủ đề trên form → option có sẵn trong cột Subject của Notion. Giữ danh sách cố định:
// Notion tự tạo option mới khi gặp tên lạ, nên không bao giờ ghi thẳng chuỗi khách gửi.
// Chủ đề gốc vẫn được ghi đầy đủ ở đầu cột Message.
const SUBJECT_MAP = {
  'Strategic Brand Advisory': 'Consulting',
  'Copywriting & Narrative': 'Storytelling',
  'Publishing & Editorial': 'Storytelling',
  'Call Request': 'Consulting',
  'Booking & Appointment': 'Consulting',
};

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  if (!isAllowedOrigin(req.headers.host, req.headers.origin || req.headers.referer)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const ip = firstForwardedIp(req.headers['x-forwarded-for']) || req.headers['x-real-ip'] || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ success: false, message: 'Bạn gửi quá nhanh, vui lòng thử lại sau ít phút.' });
  }

  const NOTION_TOKEN = process.env.NOTION_SECRET;
  if (!NOTION_TOKEN) {
    console.error('NOTION_SECRET chưa được cấu hình trên Vercel.');
    return res.status(503).json({ success: false, message: 'Hệ thống nhận yêu cầu đang tạm gián đoạn.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};

  // Honeypot: người thật không thấy ô "website"; bot điền vào → giả vờ thành công, không ghi gì.
  if (str(body.website, 10)) {
    return res.status(200).json({ success: true, message: 'Lead recorded successfully!' });
  }

  const fullName = str(body.fullName, 120);
  const email = str(body.email, 200);
  const company = str(body.company, 200);
  const subject = str(body.subject, 80);
  const message = str(body.message, 5000);
  const portfolioLink = str(body.portfolioLink, 500);

  if (fullName.length < 2 || !EMAIL_RE.test(email) || message.length < 3) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đủ họ tên, email hợp lệ và nội dung.' });
  }
  if (portfolioLink && !/^https?:\/\//i.test(portfolioLink)) {
    return res.status(400).json({ success: false, message: 'Link tài liệu phải bắt đầu bằng http:// hoặc https://' });
  }

  try {
    let uploadedFileUrl = '';
    const attachment = body.attachment;
    if (attachment && typeof attachment === 'object' && typeof attachment.data === 'string' && typeof attachment.name === 'string') {
      const safeName = attachment.name.replace(/^.*[\\/]/, '').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
      const ext = (safeName.split('.').pop() || '').toLowerCase();
      if (!ALLOWED_EXT[ext]) {
        return res.status(400).json({ success: false, message: 'Chỉ nhận file PDF, DOC, DOCX, JPG, PNG.' });
      }
      // base64 dài hơn ~1.37× dung lượng thật — chặn sớm trước khi decode
      if (attachment.data.length > MAX_FILE_BYTES * 1.4) {
        return res.status(413).json({ success: false, message: 'File vượt quá 4MB' });
      }
      const fileBuffer = Buffer.from(attachment.data, 'base64');
      if (fileBuffer.length > MAX_FILE_BYTES) {
        return res.status(413).json({ success: false, message: 'File vượt quá 4MB' });
      }
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.warn('BLOB_READ_WRITE_TOKEN is missing. Skipping file upload.');
      } else {
        const blob = await put(`leads/${safeName}`, fileBuffer, {
          access: 'public',
          addRandomSuffix: true,
          contentType: ALLOWED_EXT[ext],
        });
        uploadedFileUrl = blob.url;
      }
    }

    let extraContext = '';
    if (portfolioLink) extraContext += `\n\nLink Portfolio/CV: ${portfolioLink}`;
    if (uploadedFileUrl) extraContext += `\n\nTệp đính kèm: ${uploadedFileUrl}`;

    const properties = {
      'Name': { title: [{ text: { content: fullName } }] },
      'Email': { email: email },
      'Company': { rich_text: [{ text: { content: company } }] },
      'Subject': { select: { name: SUBJECT_MAP[subject] || 'Other' } },
      'Message': { rich_text: [{ text: { content: `[${subject || 'Contact Form'}] ${message}${extraContext}`.substring(0, 1990) } }] },
    };

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ parent: { database_id: DATABASE_ID }, properties }),
    });

    if (!response.ok) {
      console.error('Notion Error:', await response.text());
      throw new Error('notion_failed');
    }

    return res.status(200).json({ success: true, message: 'Lead recorded successfully!' });
  } catch (error) {
    console.error('Server Error:', error);
    // Không trả chi tiết lỗi nội bộ cho client
    return res.status(500).json({ success: false, message: 'Chưa gửi được, vui lòng thử lại hoặc email trực tiếp.' });
  }
}
