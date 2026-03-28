import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fullName, email, company, subject, bookingDate, message, isChatSummary, summary, niche, priority, portfolioLink, attachment } = req.body;
  const NOTION_TOKEN = process.env.NOTION_SECRET;
  const DATABASE_ID = '3308ed608af9804c8401c5599ef4f556';

  if (!NOTION_TOKEN) {
    return res.status(500).json({ message: 'NOTION_SECRET is not configured' });
  }

  try {
    let uploadedFileUrl = '';

    // Upload file to Vercel Blob if attachment exists
    if (attachment && attachment.data && attachment.name) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
         console.warn("BLOB_READ_WRITE_TOKEN is missing. Skipping file upload.");
      } else {
         const fileBuffer = Buffer.from(attachment.data, 'base64');
         const blob = await put(`leads/${Date.now()}_${attachment.name}`, fileBuffer, {
            access: 'public',
            contentType: attachment.contentType || 'application/octet-stream',
         });
         uploadedFileUrl = blob.url;
      }
    }

    // Append link and file to message
    let extraContext = '';
    if (portfolioLink) extraContext += `\n\nLink Portfolio/CV: ${portfolioLink}`;
    if (uploadedFileUrl) extraContext += `\n\nTệp đính kèm: ${uploadedFileUrl}`;

    // If it's a chat summary, we map the fields to Notion properties
    const finalName = fullName || 'Chat Assistant Lead';
    const finalSubject = subject || niche || 'Chat Inquiry';
    const finalMessage = (message || summary || 'No details provided') + extraContext;
    const finalCompany = company || (priority ? `Priority: ${priority}` : '');

    const properties = {
      'Name': {
        title: [{ text: { content: finalName } }]
      },
      'Email': {
        email: email || 'chat-lead@no-email.com'
      },
      'Company': {
        rich_text: [{ text: { content: finalCompany } }]
      },
      'Subject': {
        select: { name: (['Consulting', 'AI Automation', 'Storytelling', 'Other'].includes(finalSubject)) ? finalSubject : 'Other' }
      },
      'Message': {
        rich_text: [{ text: { content: `[CHAT SUMMARY] ${finalMessage}`.substring(0, 1990) } }]
      }
    };

    if (bookingDate) {
      properties['Booking Date'] = {
        date: { start: new Date(bookingDate).toISOString() }
      };
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties: properties
      }),
    });

    const result = await response.json();
    if (!response.ok) {
        console.error("Notion Error:", result);
        throw new Error(result.message || 'Failed to send lead to Notion');
    }

    return res.status(200).json({ success: true, message: 'Lead recorded successfully!' });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }

}
