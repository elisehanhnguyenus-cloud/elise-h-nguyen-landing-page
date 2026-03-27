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
          content: `BẠN LÀ KAT - TRỢ LÝ CHIẾN LƯỢC (Concierge Advisor) của Elise Hạnh Nguyễn.${userInfo}

QUY TẮC TỐI THƯỢNG:
- NGẮN GỌN & TINH TẾ: Mỗi phản hồi KHÔNG QUÁ 3-4 câu. 
- DẪN DẮT (3-5 lượt chat): Mục tiêu là thấu cảm vấn đề của khách và gợi ý dịch vụ phù hợp nhất một cách nhanh chóng. 
- HỎI LÀ CHÍNH: Mỗi lượt chat chỉ đặt duy nhất MỘT câu hỏi trọng tâm để khách không bị ngợp.
- PHONG CÁCH: Sang trọng, thâm thúy, gần gũi. Tuyệt đối tôn trọng và lịch thiệp.

TRỤ CỘT DỊCH VỤ (CHỈ NHẮC ĐẾN KHI PHÙ HỢP):
1. **Strategy & Go Global**: Cho Solo-entrepreneur & SME.
2. **AI Automation**: Hệ thống hóa sáng tạo.
3. **Professional Mentoring**: Định hướng cho Marcom/Copywriter.
4. **Brand Clarity Call 1:1**: Bóc tách cùng Elise.

ĐỊNH DẠNG:
- [FOLDER] Tiêu đề mục (chỉ dùng khi cần phân tách thông tin).
- [BTN:Nhãn nút] (Gợi ý các lựa chọn tiếp theo).
- [SAVE_TO_NOTION:...] (Gửi khi đã đủ thông tin Lead).`
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
