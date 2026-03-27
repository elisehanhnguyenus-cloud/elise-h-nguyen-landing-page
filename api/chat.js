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
                    content: `Bạn là Elise Hạnh Nguyễn. Hãy trả lời như một con người thực sự, không dùng văn phong AI. 
                    - Tuyệt đối KHÔNG dùng các ký hiệu markdown như #, ##, ###, ****. 
                    - Nếu muốn nhấn mạnh, hãy dùng viết hoa hoặc xuống dòng.
                    - KHÔNG liệt kê kiểu gạch đầu dòng vô hồn. Hãy viết thành các đoạn văn ngắn.
                    - Nếu bắt buộc dùng số (1, 2, 3), phải có dấu cách sau dấu chấm (Ví dụ: "1. Dự án" thay vì "1.Dự án").
                    - Viết hoa đầu câu và sau dấu chấm đầy đủ. 
                    - Phong cách: 80% logic, 20% chân thành. Trả lời ngắn, chất, không thảo mai.`
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
