// app/api/render/route.ts
import { readFile } from 'fs/promises';
import dbConnect from '@/lib/db';
import Print from '@/models/print';
import Post from '@/models/posts';
import Account from '@/models/account';
import { pushReview, GenerateMSG } from '@/lib/review';
import { render } from '@/lib/renderer';

/**
 * 接收投稿数据，渲染成图片返回或推送审核
 * @param request 包含投稿内容的请求
 * @returns 渲染后的 PNG 图片
 */
export async function POST(request: Request) {
  try {
    // 1. 连接数据库并解析请求体
    await dbConnect();
    const body = await request.json();
    let outputType = 'base64' as 'base64' | 'buffer';
    let print;
    // 1. 根据 _id 查找或创建记录
    if (body._id) {
      print = await Print.findById(body._id);
      if (!print) {
        return Response.json({ code: -1, message: `未找到该记录` }, { status: 404 });
      }
    } else {
      print = new Print( body );
    }
    if (!print.timestamp || print.timestamp <= 0) {
      print.timestamp = Date.now();
    }
    if (body.type === 'render') {
      outputType = 'buffer';
    }
    console.log('[Render] 接收到渲染请求:', outputType);
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
    // 5. 如果是投稿，创建 Post 文档并推送审核
    let post;
    if (body.type === 'post') {
      console.log('[Render] 创建投稿并推送审核');
      print.type = 'post';
      post = new Post({ print });
      post.type = 'pending';
      post.timestamp = print.timestamp;
      post.sender = print.sender;
      post.cid = print._id;
      //console.log(post)
      post.content.images.push(image);
      await post.save();
      print.pid = post._id;
      await print.save();
      // 推送审核
      const aid = process.env.REVIEW_PUSH_PLATFORM;
      const account = await Account.findOne({ aid });
      const result = await pushReview(account, print, image);
      return Response.json({
        code: 0,
        message: '渲染完成并已推送待审',
        data: {
          cid: print._id,
          pid: post._id,
          //base64: image,
          result
        }
      });
    }
    await print.save();
    return Response.json({
      code: 0,
      message: '渲染完成',
      data: {
        rid: print._id,
        base64: image
      }
    });
  } catch (error) {
    console.error('[Render] 渲染失败:', error);
    return Response.json(
      { code: -1, message: '服务器内部错误', error: error instanceof Error ? error.message : '发生未知错误' },
      { status: 500 }
    );
  }
}
