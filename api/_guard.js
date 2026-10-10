// Lớp chặn dùng chung cho các API (file bắt đầu bằng "_" nên Vercel không coi là một route).
//
// Giới hạn của lớp này — nói rõ để không ai coi nó là đủ:
// - Kiểm tra Origin/Referer chặn site khác nhúng form/chat, nhưng curl giả header được.
// - Bộ đếm tần suất nằm trong bộ nhớ của từng instance: mỗi instance đếm riêng và
//   reset khi instance tắt. Lớp chặn bền là rule Rate Limiting trong Vercel Firewall.

export function isAllowedOrigin(host, source) {
  if (!host || !source) return false;
  const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  try {
    const h = new URL(source).host;
    return h === host || extra.includes(h);
  } catch {
    return false;
  }
}

export function rateLimiter(name, max, windowMs) {
  const key = `__rate_${name}`;
  const buckets = globalThis[key] || (globalThis[key] = new Map());
  return function isLimited(ip) {
    const now = Date.now();
    const hits = (buckets.get(ip) || []).filter((t) => now - t < windowMs);
    hits.push(now);
    buckets.set(ip, hits);
    if (buckets.size > 5000) buckets.clear();
    return hits.length > max;
  };
}

export function firstForwardedIp(value) {
  return (typeof value === 'string' && value.split(',')[0].trim()) || '';
}
