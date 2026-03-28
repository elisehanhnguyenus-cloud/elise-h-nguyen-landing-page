export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { message, history, lead } = await req.json();
    const userInfo = lead ? `\nBỐI CẢNH KHÁCH HÀNG: ${JSON.stringify(lead)}` : "";

    const systemPrompt = `BẠN LÀ KAT - TRỢ LÝ CONCIERGE ADVISOR của Elise Hạnh Nguyễn.
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

THÔNG TIN ELISE:${userInfo}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || [])
    ];

    const response = await fetch("https://9router.vuhai.io.vn/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer sk-4bd27113b7dc78d1-lh6jld-f4f9c69f`, // Using provided key
      },
      body: JSON.stringify({
        model: "ces-chatbot-gpt-5.4",
        messages: messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error("Upstream Error:", errData);
      return new Response(JSON.stringify({ error: "Upstream failed" }), { status: 500 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();

          for (const line of lines) {
            if (line.trim() === "data: [DONE]") continue;
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices[0]?.delta?.content || "";
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (e) {
                // Skip malformed chunks
              }
            }
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Terminal Error:", error);
    return new Response(JSON.stringify({ message: "Internal Error" }), { status: 500 });
  }
}
