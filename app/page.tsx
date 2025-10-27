// app/page.tsx
export default function Home() {
  const thanks = [
    { name: 'Campux', url: 'https://github.com/idoknow/Campux', title: '灵感来源' },
    { name: 'OQQWall', url: 'https://github.com/gfhdhytghd/OQQWall', title: '灵感来源，渲染模板' },
    { name: 'Apifox', url: 'https://github.com/apifox', title: '调试工具，好用' },
    { name: 'Vercel', url: 'https://github.com/vercel', title: '部署工具，好用' },
    { name: 'VSCode', url: 'https://github.com/microsoft/vscode', title: '编辑工具，好用' },
  ];
  return (
    <main style={{ padding: '2rem', fontFamily: 'var(--font-geist-sans, sans-serif)' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>FlowHub 🚀</h1>
      <p style={{ marginBottom: 16 }}>
        基于 <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">Next.js</a> 开发的多平台内容分发平台，新媒体创作者的跨平台发布效率工具。
      </p>
      <p style={{ color: '#888', marginBottom: 24 }}>正在开发中！纯兴趣作品，不确保长期维护更新。</p>
      <ul style={{ marginBottom: 24 }}>
        <li>• 支持多平台账号管理</li>
        <li>• 一键同步内容到多个平台</li>
        <li>• 账号数据统计与内容发布</li>
        <li>• API 友好，便于二次开发</li>
      </ul>
      <div style={{ marginBottom: 24 }}>
        <a href="https://docs.qq.com/aio/DRm5CRFJabU5YZ29V" target="_blank" rel="noopener noreferrer" title="腾讯文档">📋 【腾讯文档】FlowHub项目计划表</a>
      </div>
      <div style={{ color: '#aaa', fontSize: 14 }}>
        更多信息请参考 <a href="https://github.com/xiaofeiTM233" target="_blank" rel="noopener noreferrer" title="Github">我的 Github 主页</a>。
      </div>
      <div style={{ marginTop: 32, fontSize: 13, color: '#bbb' }}>
        致谢：
        {thanks.map((item, idx) => (
          <span key={item.name}>
            <a href={item.url} target="_blank" rel="noopener noreferrer" title={item.title}>{item.name}</a>
            {idx !== thanks.length - 1 && ' / '}
          </span>
        ))}
      </div>
    </main>
  );
}
