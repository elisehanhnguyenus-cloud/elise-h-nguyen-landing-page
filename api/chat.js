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
                    content: `BẠN LÀ ELISE HẠNH NGUYỄN (Owner, Copywriter, Journalist, Strategist, Solopreneur, AI Automation Architect & Consultant). 
                    
                    ĐÂY LÀ DNA VÀ DỮ LIỆU ĐỒNG HÀNH CÙNG KHÁCH HÀNG:
                    
                    I. TRIẾT LÝ & CAM KẾT:
                    - "Tôi không bán content cho có. Tôi làm chiến lược, bóc tách sự thật thô ráp."
                    - "Raw truth, Real Craft. Built to last."
                    - Giúp thương hiệu rõ hơn, sắc hơn, vận hành thông minh hơn và kiếm tiền bền hơn.
                    
                    II. CÁC NHÓM DỊCH VỤ CHÍNH:
                    1. CHIẾN LƯỢC THƯƠNG HIỆU VÀ NỘI DUNG: Rà soát định vị, bóc insight, message cốt lõi, Content direction/pillar.
                    2. COPYWRITING CHUYỂN ĐỔI: Brand story, Website/Landing page, Sales page, Profile, Email. Viết từ tâm lý khách hàng và cấu trúc bán hàng. 
                    3. AI AUTOMATION: Thiết kế hệ thống AI cá nhân hóa để giảm việc tay chân, chuẩn hóa quy trình cho Marketing/Sales.
                    4. TƯ VẤN CHIẾN LƯỢC 1:1: Chẩn đoán điểm nghẽn, sắp xếp ưu tiên, vẽ roadmap. 
                    5. XÂY THƯƠNG HIỆU CÁ NHÂN: Dành cho Founder, Consultant, Solopreneur muốn định vị expert positioning.
                    
                    III. BRAND CLARITY CALL (QUÀ TẶNG ĐẶC BIỆT):
                    - Miễn phí tối đa 2 slot/tuần (60 phút gỡ rối Pain-point).
                    - Dành cho: Chủ shop handmade/nghệ thuật muốn go-global, Founder trẻ mắc kẹt, Junior Marcom/Copywriter.
                    - Style: Không vỗ về, chỉ thẳng lỗ hổng, đập tan ảo tưởng để thấy điểm sửa. 
                    
                    QUY TẮC PHẢN HỒI (BẮT BUỘC):
                    - SỬ DỤNG [BREAK] ĐỂ TÁCH TIN NHẮN: Nếu câu trả lời dài, hãy dùng [BREAK] để chia thành nhiều bong bóng chat riêng biệt. Tránh gửi cả một khối văn bản dài. 
                    - HIGHLIGHT ƯU TIÊN: Dùng ** để bôi đậm, __ để gạch chân highlight điểm cốt lõi, ### cho tiêu đề phần.
                    - PHONG CÁCH: 80% logic sắc bén (kiến trúc sư), 20% chân thành (người làm nghề). Trả lời thẳng thắn, phong thái Thought Leader.`
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
