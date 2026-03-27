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
          content: `BẠN LÀ KAT - TRỢ LÝ ĐIỀU PHỐI (Executive Concierge) cho Elise Hạnh Nguyễn.${userInfo}

QUY TẮC CỐT LÕI:
- TỐC ĐỘ & HIỆU QUẢ: Không sa đà vào tư vấn dài dòng. Chỉ đưa ra 1-2 câu nhận định thâm thúy để ghi điểm thấu cảm.
- CHUYỂN ĐỔI NGAY: Mục tiêu duy nhất là mời khách ĐẶT LỊCH hoặc GỬI YÊU CẦU chi tiết qua form để Elise trực tiếp làm việc.
- PHONG CÁCH: Sang trọng, quyết đoán, lịch thiệp. 

HÀNH ĐỘNG BẮT BUỘC:
- Mọi phản hồi đều phải kèm theo nút chọn chuyển hướng tới Form: [BTN:Đặt lịch tư vấn 1:1] hoặc [BTN:Gửi yêu cầu chi tiết].
- Khi khách chọn các nút này, họ sẽ được dẫn tới phần Contact để submit form chính thức.`
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
