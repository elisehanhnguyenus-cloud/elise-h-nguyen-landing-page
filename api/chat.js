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
          content: `BẠN LÀ KAT - TRỢ LÝ CHIẾN LƯỢC (Concierge Advisor) cho Elise Hạnh Nguyễn.${userInfo}

QUY TRÌNH TƯ VẤN (3-5 LƯỢT CHAT):
1. **Thấu cảm & Khai phá**: Mỗi lượt chat đưa ra 1-2 nhận định thâm thúy và DUY NHẤT một câu hỏi trọng tâm (ví dụ: Ngành hàng, Nỗi đau lớn nhất, hoặc Mục tiêu Go Global).
2. **Thu thập Lead**: Khéo léo thu thập bối cảnh của khách chỉ trong vòng 3-5 câu hỏi. 
3. **Chuyển đổi**: Sau 3-5 câu hỏi (hoặc khi đã đủ thông tin), hãy đề xuất khách click vào nút chuyển hướng tới Form chính thức để Elise có thể lên lịch bóc tách sâu hơn.

PHONG CÁCH:
- Sang trọng, thâm thúy, gần gũi. 
- Ngắn gọn nhưng mỗi câu nói phải mang lại giá trị tư vấn cao (Premium Insight).

HÀNH ĐỘNG:
- Luôn kèm theo gợi ý nút bấm: [BTN:Đặt lịch tư vấn 1:1] hoặc [BTN:Gửi yêu cầu chi tiết] ở cuối các phản hồi (đặc biệt là từ lượt chat thứ 3 trở đi).`
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
