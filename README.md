# Elise Hạnh Nguyễn — Personal Website

Website cá nhân: landing page + case study + tạp chí (blog) + chatbot Kat. Deploy trên Vercel.

## Cấu trúc

```
index.html            Trang chủ
work/*.html           5 case study (Emperor Cruises, Lux Cruises Group, Diamond Bay, Lazada, Selly)
blog/*.html           Tạp chí (3 bài + trang danh sách)
privacy.html          Chính sách bảo mật
api/chat.js           Backend chatbot Kat (Edge function)
api/leads.js          Backend lead → Notion + Vercel Blob
api/sheet.js          Chuyển lead sang Google Sheets (Apps Script)
api/_guard.js         Kiểm tra nguồn + giới hạn tần suất dùng chung
assets/css/styles.css CSS build sẵn từ Tailwind (KHÔNG sửa tay — sửa src/tailwind.css rồi build lại)
src/tailwind.css      Nguồn CSS + design tokens trong tailwind.config.js
scripts/              Script tối ưu ảnh
```

## Biến môi trường (Vercel → Project Settings → Environment Variables)

| Tên | Bắt buộc | Ghi chú |
|---|---|---|
| `AI_API_KEY` | ✅ | Key AI cho chatbot Kat. **Không bao giờ hardcode vào code.** |
| `AI_API_URL` | — | Endpoint chat completions (có mặc định) |
| `AI_MODEL` | — | Tên model (có mặc định) |
| `NOTION_SECRET` | ✅ | Token Notion integration cho lead |
| `BLOB_READ_WRITE_TOKEN` | — | Vercel Blob, để upload file đính kèm từ form |
| `NOTION_DATABASE_ID` | — | Database lead trong Notion (có giá trị mặc định) |
| `GAS_URL` | — | URL web app Google Apps Script nhận lead vào Sheets (có giá trị mặc định) |
| `GAS_TOKEN` | — | Mã bí mật gửi kèm tới Apps Script. **Chỉ đặt sau khi Apps Script đã kiểm tra và bỏ trường `token`**, nếu không mã sẽ bị ghi thành một cột trong Sheet |
| `ALLOWED_ORIGINS` | — | Tên miền khác được phép gọi API, cách nhau bằng dấu phẩy (ví dụ khi gắn domain mới song song domain cũ) |

## Bảo mật API

- `api/_guard.js`: kiểm tra Origin/Referer và giới hạn tần suất dùng chung cho `/api/chat`, `/api/leads`, `/api/sheet`. Bộ đếm nằm trong bộ nhớ từng instance nên chỉ chặn spam đơn giản — lớp chặn bền là rule **Rate Limiting** trong Vercel Firewall.
- Trình duyệt không gọi thẳng Google Apps Script; mọi lead vào Sheets đi qua `/api/sheet`.
- Nội dung AI và tên khách luôn được escape trước khi hiển thị; nút trong chat dùng `data-*` + một bộ lắng nghe chung, không dùng `onclick` nội tuyến.

## Lệnh

```bash
npm install
npm run build:css   # build lại CSS sau khi sửa class/tokens
npm run watch:css   # build tự động khi đang dev
npm run images      # tối ưu lại ảnh trong assets/images
```

## Khi mua domain

Tìm và thay toàn bộ `web1-chi-one.vercel.app` bằng domain mới trong: `index.html`, `work/*.html`, `blog/*.html`, `privacy.html`, `sitemap.xml`, `robots.txt` (đã đánh dấu chú thích `ĐỔI KHI CÓ DOMAIN`).
