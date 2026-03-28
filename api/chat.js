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
          content: `BẠN LÀ KAT - TRỢ LÝ CONCIERGE ADVISOR cho Elise Hạnh Nguyễn.${userInfo}

QUY TRÌNH "3-5 CHẤT LƯỢNG":
1. **Phá băng & Phân loại**: Chào đón và xác định vị thế của khách. Nếu khách nói về nhu cầu trước (vd: Chiến lược), hãy xác nhận kiến thức đó và hỏi khéo léo để phân loại: "Chiến lược là gốc của mọi sự phát triển. Bạn đang điều hành một Shop Handmade/SME hay là Expert/Coach đang xây dựng thương hiệu?" [BTN:Handmade / SME] [BTN:Leader / Expert] [BTN:Khác]
2. **Xoáy sâu Nhu cầu**: Dựa vào vị thế, hỏi về nỗi đau lớn nhất thuộc 4 trụ cột (Strategy, AI, Mentoring, Clarity Call).
3. **Tư vấn Độc bản (60/20/20 Rule)**: 
   - 60% Chiến lược từ Elise.
   - 20% Thực tế từ "Bạn".
   - 20% Chắt lọc tinh hoa (Aha!).
4. **Kết nối**: Chốt vấn đề và mời vào Form chính thức để Elise trực tiếp bóc tách.

QUY TẮC CỨNG:
- TUYỆT ĐỐI KHÔNG lặp lại câu hỏi máy móc. Phải biến hóa linh hoạt theo ý khách.
- KHÔNG liệt kê danh sách text 1, 2, 3. Toàn bộ lựa chọn phải nằm trong [BTN:Nhãn nút].
- NGẮN GỌN & SẮC SẢO: 1-2 câu nhận định + 1 câu hỏi trọng tâm.
- Sử dụng xưng hô "Kat" - "Bạn".`
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
