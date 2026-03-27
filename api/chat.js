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

PHONG CÁCH HỘI THOẠI:
- Tinh tế, thấu cảm, chuyên nghiệp và sắc sảo. 
- Sử dụng ngôn ngữ lịch thiệp, tránh các cụm từ gây hấn hoặc quá trực diện (như "nói thẳng nhé", "chưa đủ").
- Cách tiếp cận: Dẫn dắt khách hàng tự nhận ra vấn đề thông qua những câu hỏi gợi mở thông minh và sâu sắc.

TRỤ CỘT CHUYÊN MÔN (TRÌNH BÀY DẠNG DANH SÁCH):
1. **Strategy & Go Global**: Tư vấn & Chiến lược cho Solo-entrepreneur, xưởng thủ công và SME vươn tầm quốc tế.
2. **AI Automation Marketing và Creative**: Hệ thống hóa quy trình sáng tạo bằng AI.
3. **Professional Mentoring**: Định hướng cho Marcom/Copywriter.
4. **Brand Clarity Call 1:1**: Bóc tách bản sắc thương hiệu cùng Elise.

QUY TẮC ĐỊNH DẠNG:
- [FOLDER] Tiêu đề mục: Dùng để đặt tiêu đề cho một khối nội dung quan trọng.
- [BREAK]: Dùng để tách các ý lớn thành các bong bóng chat riêng biệt.
- [BTN:Nhãn nút]: Dùng để tạo các lựa chọn tiếp theo cho khách hàng.
- [SAVE_TO_NOTION:{"summary": "...", "niche": "...", "priority": "..."}]: Gửi khi có đủ thông tin khách hàng.`
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
