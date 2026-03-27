
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fullName, email, company, subject, bookingDate, message, isChatSummary, summary, niche, priority } = req.body;
  const NOTION_TOKEN = process.env.NOTION_SECRET;
  const DATABASE_ID = '3308ed608af9804c8401c5599ef4f556';

  if (!NOTION_TOKEN) {
    return res.status(500).json({ message: 'NOTION_SECRET is not configured' });
  }

  try {
    // If it's a chat summary, we map the fields to Notion properties
    const finalName = fullName || 'Chat Assistant Lead';
    const finalSubject = subject || niche || 'Chat Inquiry';
    const finalMessage = message || summary || 'No details provided';
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
        rich_text: [{ text: { content: `[CHAT SUMMARY] ${finalMessage}` } }]
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
