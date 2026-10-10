import { isAllowedOrigin, rateLimiter, firstForwardedIp } from './_guard.js';

// ============================================================
// /api/sheet — chuyển lead từ trình duyệt sang Google Apps Script (Google Sheets CRM).
// URL Apps Script nằm ở server thay vì lộ trong mã trang.
//
// Biến môi trường (Vercel → Settings → Environment Variables):
// - GAS_URL   (tùy chọn) — URL web app Apps Script. Mặc định là bản đang dùng.
// - GAS_TOKEN (tùy chọn) — CHỈ đặt sau khi Apps Script đã được sửa để kiểm tra rồi bỏ
//   trường "token"; nếu đặt sớm, Apps Script có thể ghi token thành một cột trong Sheet.
// ============================================================

const GAS_URL = process.env.GAS_URL || 'https://script.google.com/macros/s/AKfycbzoyt63n-Ow1RZhiKWdkeT2I234BjlPbRBbdviGPQzRj_hoifRY4e1NH0gGjAhIMWMH/exec';
const isLimited = rateLimiter('sheet', 30, 10 * 60 * 1000);

// Giữ đúng thứ tự trường như payload trình duyệt gửi trước đây — Apps Script có thể dựng cột theo thứ tự này.
const FIELDS = {
  name: 120, phone: 40, email: 200, company: 200, subject: 80, source: 500, sessionId: 80,
  chatHistory: 20000, portfolioLink: 500, attachmentName: 120, timestamp: 40, interest: 120, intent_level: 10,
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false });
  }
  if (!isAllowedOrigin(req.headers.host, req.headers.origin || req.headers.referer)) {
    return res.status(403).json({ success: false });
  }
  const ip = firstForwardedIp(req.headers['x-forwarded-for']) || req.headers['x-real-ip'] || 'unknown';
  if (isLimited(ip)) {
    return res.status(429).json({ success: false });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const row = {};
  for (const [key, max] of Object.entries(FIELDS)) {
    row[key] = typeof body[key] === 'string' ? body[key].trim().slice(0, max) : '';
  }
  if (!EMAIL_RE.test(row.email) && row.phone.replace(/\D/g, '').length < 6) {
    return res.status(400).json({ success: false });
  }
  if (!['hot', 'warm', 'cold'].includes(row.intent_level)) row.intent_level = '';
  if (process.env.GAS_TOKEN) row.token = process.env.GAS_TOKEN;

  try {
    // Apps Script chạy doPost ngay ở request đầu rồi trả 302 tới trang kết quả — không cần theo redirect.
    const r = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(row),
      redirect: 'manual',
    });
    if (r.status >= 400) throw new Error(`gas_${r.status}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Sheets relay error:', error);
    return res.status(502).json({ success: false });
  }
}
