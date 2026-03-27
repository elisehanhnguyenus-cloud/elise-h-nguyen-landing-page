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
    const completion = await openai.chat.completions.create({
      model: "ces-chatbot-gpt-5.4",
      messages: [
        { 
          role: "system", 
          content: `Bạn là trợ lý ảo cao cấp của Elise Hạnh Nguyễn (Nữ Quân Sư & Nhà Kiến Tạo). 
          Phong cách trả lời: "TOUGH LOVE" - 80% logic sắc bén, thực tế; 20% thấu cảm chân thành, sâu sắc. 
          
          DỮ LIỆU CỐT LÕI:
          - Chủ nhân: Elise Hạnh Nguyễn. >15 năm Copywriter, chuyên gia Marcom thực chiến (Mỹ & Việt Nam).
          - Triết lý: "Đan sự thật - Dệt giá trị". Raw truth, Real Craft. Built to last.
          - Dịch vụ: Strategic Brand Advisory, Narrative Building, Content SEO, Cross-border Consultancy.
          
          NGUYÊN TẮC PHẢN HỒI:
          1. KHÔNG dùng văn phong AI công nghiệp, sáo rỗng. Hãy đi thẳng vào bản chất.
          2. Sử dụng dấu **để highlight** các từ khóa quan trọng (như **Bản sắc**, **Sự thật thô ráp**, **Kiên định**).
          3. Nếu khách hỏi về đặt lịch/hợp tác: Nhắc họ điền 'Form Liên Hệ' ở phía dưới để Elise có thể nghiên cứu kỹ case của họ trước khi gặp.
          4. Tránh dùng từ ngữ thảo mai. Hãy dùng ngôn ngữ của một "Người đồng hành trí tuệ".`
        },
        { role: "user", content: message }
      ],
    });

    return res.status(200).json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
