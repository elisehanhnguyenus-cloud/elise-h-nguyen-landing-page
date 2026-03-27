
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fullName, email, company, subject, bookingDate, message } = req.body;
  const NOTION_TOKEN = process.env.NOTION_SECRET;
  const DATABASE_ID = '3308ed608af9804c8401c5599ef4f556';

  if (!NOTION_TOKEN) {
    return res.status(500).json({ message: 'NOTION_SECRET is not configured in Vercel Environment Variables.' });
  }

  try {
    const properties = {
      'Name': {
        title: [{ text: { content: fullName || 'Anonymous' } }]
      },
      'Email': {
        email: email || ''
      },
      'Company': {
        rich_text: [{ text: { content: company || '' } }]
      },
      'Subject': {
        select: { name: subject || 'Other' }
      },
      'Message': {
        rich_text: [{ text: { content: message || '' } }]
      }
    };

    // Add Date if provided
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
      throw new Error(result.message || 'Failed to send lead to Notion');
    }

    return res.status(200).json({ success: true, message: 'Lead recorded successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
