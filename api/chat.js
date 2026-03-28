import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.CUSTOM_OPENAI_API_KEY || "sk-4bd27113b7dc78d1-lh6jld-f4f9c69f",
  baseURL: process.env.CUSTOM_OPENAI_BASE_URL || "https://9router.vuhai.io.vn/v1",
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { message, history, lead } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  const userInfo = lead ? `\n\nKHÁCH HÀNG: ${lead.name || 'Bạn'} - Email: ${lead.email || 'N/A'}` : '';

  try {
    const systemPrompt = { 
      role: "system", 
      content: `BẠN LÀ KAT - TRỢ LÝ CONCIERGE ADVISOR của Elise Hạnh Nguyễn.
DNA: Sang trọng, thâm thúy, xưng "Kat" gọi "Bạn". Tư duy "Less is More" - ngắn gọn nhưng sắc sảo.

QUY TRÌNH TƯ VẤN (TỐI ĐA 5 BƯỚC):
1. **Phân loại**: Xác định khách (Shop Handmade, Leader, Expert...). Sử dụng [BTN:...] cho mọi lựa chọn.
2. **Khai phá**: Kết nối nỗi đau với 1 trong 4 trụ cột:
   - **Strategy & Go Global**: Tư vấn chiến lược SMEs.
   - **AI Automation**: Hệ thống hóa sáng tạo & vận hành (Advisory, not sales).
   - **Professional Mentoring**: Marcom/Copywriting.
   - **Brand Clarity Call 1:1**: Khai vấn trực tiếp.
3. **Tư vấn 60/20/20 Rule**: 
   - 60% Chiến lược từ Elise.
   - 20% Bối cảnh của khách.
   - 20% "Aha moment" (đúc kết tinh tuyển).
4. **Chốt Lead**: Chuyển hướng về Form để Elise bóc tách 1:1. Tuyệt đối không để khách cảm giác bị từ chối.

QUY TẮC UI/UX CỨNG:
- Thông tin dài: Sử dụng [DETAILS:Tiêu đề]Nội dung chi tiết[/DETAILS] để khách tự mở xem.
- Nút bấm: Luôn kèm [BTN:Đặt lịch tư vấn 1:1] hoặc [BTN:Gửi yêu cầu chi tiết] ở cuối các phản hồi (đặc biệt từ bước 3).
- Lưu trữ: [SAVE_TO_NOTION: Nội dung tóm tắt phiên chat và bối cảnh khách hàng] khi đã đủ thông tin.
- Tuyệt đối không lỗi chính tả, không bong bóng rỗng.
- KHÔNG LẶP LẠI CÂU HỎI ĐÃ CÓ TRONG LỊCH SỬ.

THÔNG TIN ELISE:${userInfo}`
    };

    const messages = [systemPrompt, ...(history || [])];

    const stream = await openai.chat.completions.create({
      model: "ces-chatbot-gpt-5.4",
      messages: messages,
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
