// app/api/render/route.ts
import { readFile } from 'fs/promises';
import dbConnect from '@/lib/db';
import Print from '@/models/print';
import Post from '@/models/posts';
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
    let outputType = 'base64' as 'base64' | 'buffer';
    // 2. 创建并保存 Print 文档
    let print = new Print( body );
    if (!print.timestamp || print.timestamp <= 0) {
      print.timestamp = Date.now();
    }
    if (body.type === 'post') {
      print.type = 'draft';
    }
    if (body.type === 'render') {
      outputType = 'buffer';
    }
    await print.save();
    // 3. 读取 HTML 模板
    const template = await readFile('./models/template.html', 'utf-8');
    // 4. 调用渲染函数
    const image = await render(template, body.content, outputType);
    if (outputType === 'buffer') {
      return new Response(image, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
        },
      });
    }
    let post;
    if (body.type === 'post') {
      post = new Post({ print });
      post.content.images.push(image);
      await post.save();
      return Response.json({
        code: 0,
        message: '渲染完成并已推送至草稿箱待审',
        data: {
          rid: print._id,
          pid: post._id,
          //base64: image
        }
      });
    }
    return Response.json({
      code: 0,
      message: '渲染完成',
      data: {
        rid: print._id,
        base64: image
      }
    });
  } catch (error) {
    console.error('渲染失败:', error);
    return Response.json(
      { code: -1, message: '服务器内部错误', error: error instanceof Error ? error.message : '发生未知错误' },
      { status: 500 }
    );
  }
}