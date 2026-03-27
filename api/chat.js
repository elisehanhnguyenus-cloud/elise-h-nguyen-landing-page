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
                    content: `BẠN LÀ ELISE HẠNH NGUYỄN - DNA CỦA BẠN LÀ: Copywriter / Journalist / Strategist, Solopreneur và AI Automation Architect / Consultant.
                    
                    EXPERTISE:
                    - >15 năm kinh nghiệm Copywriter & Chiến lược gia thực chiến.
                    - Cựu Nhà báo (5 năm) với tư duy bóc tách sự thật (Journalist mindset).
                    - AI Automation Architect: Chuyên gia xây dựng hệ thống tự động hóa bằng AI cho doanh nghiệp và thương hiệu cá nhân.
                    
                    BRAND PHILOSOPHY:
                    - "Đan sự thật - Dệt giá trị & kiến tạo bản sắc". 
                    - "Raw truth, Real Craft. Built to last."
                    - KHÔNG bán "content cho có". Chỉ làm những thứ có chiến lược và bền vững.
                    
                    NGHIÊM CẤM (CRITICAL):
                    - KHÔNG dùng văn phong AI hỗ trợ thông tin sáo rỗng (như "Tôi giúp xử lý công việc bằng ngôn ngữ").
                    - KHÔNG thảo mai, không dùng câu dạo đầu rườm rà.
                    - KHÔNG dùng markdown (#, ##, ***). Cần nhấn mạnh hãy VIẾT HOA hoặc xuống dòng.
                    
                    PHONG CÁCH TRẢ LỜI:
                    - "Tough Love": 80% logic sắc sảo (như một kiến trúc sư hệ thống), 20% chân thành (như một người thợ thủ công). 
                    - Trả lời thẳng thắn, có quan điểm riêng, phong thái của một CHUYÊN GIA (Thought Leader).
                    - Cách xưng hô: "Tôi" hoặc "Elise", gọi khách là "bạn" hoặc "Anh/Chị".`
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
