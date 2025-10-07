// app/api/render/route.ts
import path from 'path';
import axios from 'axios';
import { readFile } from 'fs/promises';
import dbConnect from '@/lib/db';
import Draft from '@/models/drafts';
import Account from '@/models/accounts';
import Option from '@/models/options';
import { pushReview } from '@/lib/review';
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
    // 2. 获取配置选项
    let option = await Option.findById('000000000000000000000000');
    if (!option) {
      // 如果不存在默认配置，创建一个
      option = new Option({ _id: '000000000000000000000000' });
      await option.save();
    }
    let outputType = 'base64' as 'base64' | 'buffer' | `base64Array` | 'html';
    let draft;
    // 1. 根据 _id 查找或创建记录
    if (body._id) {
      draft = await Draft.findById(body._id);
      if (!draft) {
        return Response.json({ code: -1, message: `未找到该记录` }, { status: 404 });
      }
    } else {
      draft = new Draft( body );
    }
    if (!draft.timestamp || draft.timestamp <= 0) {
      draft.timestamp = Date.now();
    }
    if (body.type === 'render') {
      outputType = 'buffer';
    }
    if (body.type === 'renderhtml') {
      outputType = 'html';
    }
    console.log('[Render] 接收到渲染请求:', outputType);
    // 3. 读取 HTML 模板
    const template = await readFile(
      path.join(process.cwd(), 'models', 'template.html'), 
      'utf-8'
    );
    // 4. 调用渲染函数
    let image: any;
    if (process.env.RENDER_TYPE === '1' && process.env.REMOTE_CHROME_URL) {
      // 调用本地渲染函数
      image = await render(template, body.content, outputType);
    } else if (process.env.RENDER_TYPE === '2' && process.env.RENDER_URL) {
      // 调用远程渲染函数
      let newType: 'base64' | 'base64Array' | 'html';
      if (outputType === 'buffer') {
        newType = 'base64';
      } else {
        newType = outputType;
      }
      const cfrender = await axios.post(process.env.RENDER_URL, {
        template,
        data: body.content,
        newType
      });
      if (outputType === 'buffer') {
        image = Buffer.from(cfrender.data.base64, 'base64');
      } else {
        image = cfrender.data[outputType];
      }
    } else {
      return Response.json({ code: -1, message: '服务器内部错误', error: '未设置渲染函数' }, { status: 500 });
    }
    if (outputType === 'buffer') {
      return new Response(image, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
        },
      });
    }
    if (outputType === 'html') {
      return new Response(image, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    // 5. 如果是投稿，推送审核
    if (body.type === 'post') {
      console.log('[Render] 推送审核');
      // 推送审核
      const aid = option.review_push_platform;
      const account = await Account.findOne({ aid });
      const result = await pushReview(account, draft, image);
      return Response.json({
        code: 0,
        message: '渲染完成并已推送待审',
        data: {
          cid: draft._id,
          //base64: image,
          result
        }
      });
    }
    await draft.save();
    return Response.json({
      code: 0,
      message: '渲染完成',
      data: {
        cid: draft._id,
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
