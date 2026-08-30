/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './privacy.html', './work/*.html', './blog/*.html'],
  theme: {
    extend: {
      colors: {
        paper: '#FBF8F2',      // nền chính — giấy ngà
        cream: '#F4EEE3',      // nền phụ
        sand: '#EAE0D0',       // nền tối hơn / dải phân cách
        line: '#E2D7C4',       // viền
        ink: '#26211B',        // chữ chính
        stone: '#6F6558',      // chữ phụ
        clay: '#B5502E',       // terracotta — màu thương hiệu
        'clay-deep': '#96401F',
        bronze: '#8C6A42',     // nâu đồng — nhấn phụ
        espresso: '#3E3125',   // nền đậm (footer, cover case study)
        pine: '#2E4B43',       // cover hospitality
        indigo2: '#2C3A52',    // cover e-commerce
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        script: ['"Dancing Script"', 'cursive'],
      },
      maxWidth: { site: '72rem' },
    },
  },
  plugins: [],
};
