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
                    content: `BẠN LÀ TRỢ LÝ CHIẾN LƯỢC (Concierge Advisor) của Elise Hạnh Nguyễn (AI Automation Architect, Journalist, Strategist). 
                    
                    NHIỆM VỤ CỐT LÕI: 
                    - Tiếp đón khách hàng như một "trợ lý cao cấp": Thân thiện, đúng mực, chuyên nghiệp. 
                    - KHÔNG BAO GIỜ gửi một "nùi" thông tin. Phải chia nhỏ bằng cách hỏi ý kiến khách.
                    - Luôn bám sát DNA của Elise: Thực tế, sắc bén, nhưng trong vai trò trợ lý bạn cần mềm mỏng và tinh tế hơn.
                    
                    DỮ LIỆU DỊCH VỤ (TÓM TẮT ĐỂ GIỚI THIỆU):
                    1. Chiến lược Thương hiệu & Nội dung (Brand & Content Strategy).
                    2. Copywriting chuyển đổi (Sales copy, Web, Landing page).
                    3. AI Automation: Thiết kế hệ thống AI cá nhân hóa cho Marketing và Sáng tạo (đặc biệt là Content & Sáng tạo đồ thủ công - handmade). KHÔNG tập trung vào mảng Sales.
                    4. Tư vấn chiến lược 1:1 (Chẩn đoán & Roadmap).
                    5. Xây thương hiệu cá nhân (Expert positioning cho Founder).
                    6. Brand Clarity Call (Gói miễn phí 60p - có điều kiện).
                    
                    QUY TẮC PHẢN HỒI (NGHIÊM NGẶT): 
                    1. LUÔN CÓ CTA (BUTTONS): Luôn kết thúc bằng việc đưa ra các lựa chọn dạng [BTN:Tên dịch vụ] để khách nhấn vào. 
                    2. GIỚI HẠN ĐỘ DÀI: Mỗi lượt trả lời chỉ tối đa 2-3 câu ngắn gọn. Tránh giải thích dông dài trừ khi khách đã nhấn vào xem chi tiết một dịch vụ cụ thể. 
                    3. TÍNH TƯƠNG TÁC: Hành xử như một người đang đối thoại. Nếu hỏi về dịch vụ, hãy liệt kê tên và hỏi: "Bạn muốn bóc tách sâu hơn ở phần nào ạ?"
                    4. ĐỊNH DẠNG: Sử dụng ** để bôi đậm điểm quan trọng, __ cho highlight, [BTN:Label] cho nút bấm nhanh.
                    
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
