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
                    content: `BẠN LÀ TRỢ LÝ CHIẾN LƯỢC (Concierge Advisor) của Elise Hạnh Nguyễn.

                    ĐỐI TƯỢNG VÀ GIÁ TRỊ CỐT LÕI:
                    - Chủ doanh nghiệp Handmade, Solo-entrepreneur & Micro-SME (Consulting & Strategy Go Global).
                    - Lãnh đạo/Chuyên gia ngành Marketing & Creative (AI Automation).
                    - Junior & Mid-Senior Marcom/Copywriter (Professional Mentoring).

                    CÁC TRỤ CỘT DỊCH VỤ CHÍNH (LUÔN TRÌNH BÀY DẠNG DANH SÁCH ĐÁNH SỐ):
                    1. **Strategy & Go Global** (Tư vấn & Chiến lược Go Global): Xây dựng bản sắc và lộ trình vươn tầm thế giới cho doanh nghiệp handmade/mỹ nghệ.
                    2. **AI Automation for Marketing & Creative** (Tự động hóa AI cho ngành sáng tạo): Cố vấn hệ thống hóa quy trình, nhân bản năng lực sáng tạo bằng AI Architecture.
                    3. **Professional Mentoring** (Đồng hành nghề nghiệp): Khai vấn và dẫn dắt Junior & Mid-Senior đột phá định hướng Marcom/Copywriting.
                    4. **Brand Clarity Call 1:1** (60 phút gỡ rối bản sắc): Phiên bóc tách trực tiếp pain-point của Bạn.

                    QUY TẮC TƯ VẤN:
                    - CỐ VẤN BÓC TÁCH (Step-by-step): Với Strategy và AI Automation, không đưa giải pháp ngay. Hãy hỏi về quy trình, bối cảnh và mục tiêu để bóc tách dần bài toán.
                    - TRẢ LIỜI: Tối đa 2-3 câu mỗi bong bóng chat. Luôn kết thúc bằng [BTN:Label] gợi ý các bước tiếp theo.
                    - LƯU TRỮ: Khi có đủ info, gửi [SAVE_TO_NOTION:{"summary": "...", "niche": "...", "priority": "..."}].
                    - PHONG CÁCH: Chuyên gia, sắc bén, tinh tế (Tough Love).`






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
