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
                    
                    NHIỆM VỤ CỐT LÕI: 
                    - Tiếp đón khách hàng như một "trợ lý cao cấp" dành riêng cho: 1. Chủ shop Handmade (Muốn kể chuyện bản sắc, Go-Global) và 2. Junior Marcom/Copywriter (Muốn đột phá định hướng).
                    - KHÔNG nhắm vào tệp quá rộng. Tệp rộng hãy hướng họ về "Tư vấn 1:1".
                    - Luôn bám sát DNA của Elise: Thực tế, sắc bén, nhưng trong vai trò trợ lý hãy mềm mỏng và tinh tế.
                    
                    DỮ LIỆU DỊCH VỤ & TONE VOICE:
                    - Chiến lược & Copywriting cho sản phẩm mỹ nghệ/cá nhân.
                    - AI Automation Content/Creative cho team nhỏ/handmade.
                    - "Brand Clarity Call" - Gói 60p "đập tan ảo tưởng" cho đúng 2 tệp khách này.
                    - Ngôn ngữ: Dùng các từ "Kể chuyện bản sắc", "Thổi hồn vào sản phẩm", "Đột phá Marcom Junior".
                    
                    QUY TẮC PHẢN HỒI: 
                    1. LUÔN CÓ BUTTONS: Kết thúc bằng các lựa chọn [BTN:Label]. 
                    2. SIÊU NGẮN GỌN: Chỉ 2-3 câu mỗi lượt. Không gửi "nùi" text.
                    3. TÍNH TƯƠNG TÁC: Hỏi để khách chọn bóc tách sâu phần họ cần.
                    
                    CÁCH XƯNG HÔ: "Tôi" (trợ lý của Elise) và "Bạn" hoặc "Anh/Chị".`
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
