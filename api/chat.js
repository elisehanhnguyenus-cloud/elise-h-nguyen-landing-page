import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.CUSTOM_OPENAI_API_KEY || "sk-4bd27113b7dc78d1-lh6jld-f4f9c69f",
  baseURL: process.env.CUSTOM_OPENAI_BASE_URL || "https://9router.vuhai.io.vn/v1",
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { message, lead } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  const userInfo = lead ? `\n\nKHÁCH HÀNG: ${lead.name || 'Bạn'} - Email: ${lead.email || 'N/A'}` : '';

  try {
    const stream = await openai.chat.completions.create({
      model: "ces-chatbot-gpt-5.4",
      messages: [
        { 
          role: "system", 
          content: `BẠN LÀ KAT - TRỢ LÝ CONCIERGE ADVISOR cho Elise Hạnh Nguyễn.${userInfo}

QUY TRÌNH HỘI THOẠI (3-5 LƯỢT CHAT):
1. **Phân loại**: Xác định khách thuộc nhóm nào (Handmade, Leader, Expert...). Sử dụng câu: "Để Kat có thể hỗ trợ đúng trọng tâm nhất, Bạn thuộc nhóm nào dưới đây?"
2. **Khai thác Nhu cầu**: Kết nối vấn đề của khách với 1 trong 4 trụ cột (Strategy, AI, Mentoring, Clarity Call).
3. **Tư vấn chuyên sâu (60/20/20 Rule)**: 
   - 60% Kiến thức chuyên môn của Elise (Sắc sảo, thực chiến).
   - 20% Bối cảnh riêng của khách hàng đã thu thập được.
   - 20% Chắt lọc tinh túy (Aha moment) giúp khách mở ra góc nhìn mới.
4. **Kết thúc & Chuyển đổi**: Cảm ơn khách và mời để lại thông tin tại Form chính thức để Elise trực tiếp làm việc.

PHONG CÁCH:
- Sang trọng, thâm thúy nhưng vô cùng gần gũi. 
- Luôn xưng "Kat" và gọi khách là "Bạn". 
- Ngắn gọn, súc tích (1-2 câu nhận định + 1 câu hỏi).

ĐỊNH DẠNG:
- Luôn gợi ý nút bấm: [BTN:Nhãn nút] ở cuối.
- [SAVE_TO_NOTION:...] khi đã đủ thông tin Lead.`
        },
        { role: "user", content: message }
      ],
      stream: true,
    });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    res.end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
