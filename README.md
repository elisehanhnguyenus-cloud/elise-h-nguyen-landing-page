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

## Lệnh

```bash
npm install
npm run build:css   # build lại CSS sau khi sửa class/tokens
npm run watch:css   # build tự động khi đang dev
npm run images      # tối ưu lại ảnh trong assets/images
```

## Khi mua domain

Tìm và thay toàn bộ `web1-chi-one.vercel.app` bằng domain mới trong: `index.html`, `work/*.html`, `blog/*.html`, `privacy.html`, `sitemap.xml`, `robots.txt` (đã đánh dấu chú thích `ĐỔI KHI CÓ DOMAIN`).
