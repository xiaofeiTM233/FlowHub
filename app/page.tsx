// app/page.tsx
export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🚀 Next.js + App Router + MongoDB</h1>
      <p>
        ✅ API 已配置：
        <br />
        • <a href="/api/users" target="_blank">GET /api/users</a> → 获取用户列表
        <br />
        • <strong>POST /api/users</strong> → 创建用户（用 Postman / Curl 测试）
      </p>
    </main>
  );
}