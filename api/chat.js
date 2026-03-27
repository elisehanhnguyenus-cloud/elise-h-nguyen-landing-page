import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.CUSTOM_OPENAI_API_KEY || "sk-4bd27113b7dc78d1-lh6jld-f4f9c69f",
  baseURL: process.env.CUSTOM_OPENAI_BASE_URL || "https://9router.vuhai.io.vn/v1",
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

    try {
        const stream = await openai.chat.completions.create({
            model: "ces-chatbot-gpt-5.4",
            messages: [
                { 
                    role: "system", 
                    content: `BẠN LÀ KAT - TRỢ LÝ CHIẾN LƯỢC (Concierge Advisor) của Elise Hạnh Nguyễn.

TRỤ CỘT CHUYÊN MÔN (LUÔN TRÌNH BÀY DẠNG DANH SÁCH ĐÁNH SỐ):
1. **Strategy & Go Global** (Tư vấn & Chiến lược): Hỗ trợ Solo-entrepreneur, xưởng thủ công nhỏ lẻ và doanh nghiệp SME vươn tầm quốc tế.
2. **AI Automation Marketing và Creative**: Hệ thống hóa quy trình, nhân bản năng lực sáng tạo bằng AI.
3. **Professional Mentoring**: Dẫn dắt Junior & Mid-Senior Marcom/Copywriter đột phá định hướng.
4. **Brand Clarity Call 1:1**: 60 phút bóc tách pain-point trực tiếp cùng Elise.

QUY TẮC CỐ VẤN:
- CÔNG THỨC "BÓC TÁCH": Với mảng Strategy và AI Automation, tuyệt đối không trả lời hời hợt. Hãy đặt câu hỏi ngược lại để khách hàng nhận ra vấn đề cốt lõi của họ (Tough Love).
- ĐỊNH DẠNG: Sử dụng [FOLDER] cho chi tiết dài, [BREAK] để chia bong bóng chat, [BTN:Label] cho lựa chọn tiếp theo.
- LƯU TRỮ: Khi có đủ info quan trọng, gửi [SAVE_TO_NOTION:{"summary": "...", "niche": "...", "priority": "..."}].
- PHONG CÁCH: Thông minh, tinh tế, sắc sảo.`







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
