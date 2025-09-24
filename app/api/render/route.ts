// app/api/render/route.ts
import { readFile } from 'fs/promises';
import dbConnect from '@/lib/db';
import Print from '@/models/print';
import { render } from '@/lib/renderer'; // 确保路径正确

/**
 * 接收投稿数据，存入数据库，并渲染成图片返回
 * @param request 包含投稿内容的请求
 * @returns 渲染后的 PNG 图片
 */
export async function POST(request: Request) {
  try {
    // 1. 连接数据库并解析请求体
    await dbConnect();
    const body = await request.json();
    // 2. 创建并保存 Print 文档
    let print = new Print( body );
    print.type = 'draft';
    await print.save();
    // 3. 读取 HTML 模板
    const template = await readFile('./models/template.html', 'utf-8');
    // 4. 调用渲染函数
    const image = await render(template, body.content, 'buffer');
    // 5. 返回 PNG 图片
    return new Response(image, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error('渲染失败:', error);
    return Response.json(
      { code: -1, message: '服务器内部错误', error: error instanceof Error ? error.message : '发生未知错误' },
      { status: 500 }
    );
  }
}