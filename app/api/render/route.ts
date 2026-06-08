// app/api/render/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pushReview } from '@/lib/review';
import { toRender } from '@/lib/renderer';
import { getFile } from '@/lib/storage';
import { authApi } from "@/lib/auth";
import dbConnect from '@/lib/db';
import Draft from '@/models/drafts';
import Account from '@/models/accounts';
import Option from '@/models/options';

/**
 * 接收投稿数据，渲染成 HTML 返回
 * @param request 包含投稿内容的请求
 * @returns 渲染后的 HTML
 */
export async function GET(request: NextRequest) {
  try {
    // 获取 cid
    const searchParams = new URLSearchParams(request.url.split('?')[1]);
    const cid = searchParams.get('cid');
    // 1. 验证参数
    if (!cid) {
      return NextResponse.json({
        code: -1,
        message: "缺少参数"
      }, { status: 400 });
    }
    await dbConnect();
    // 2. 根据 cid (即 _id) 查找帖子
    let draft = await Draft.findById(cid);
    if (!draft) {
      return NextResponse.json({
        code: -1,
        message: `未找到ID为 ${cid} 的帖子`
      }, { status: 404 });
    }
    // 3. 调用渲染函数
    const result = await toRender(draft.content, draft.timestamp, 'html');
    // 4. 返回 HTML
    return new NextResponse(result as string, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('获取帖子信息失败:', error);
    return NextResponse.json({
      code: -1,
      message: error.message || '服务器内部错误'
    }, { status: 500 });
  }
}

/**
 * 接收投稿数据，渲染成图片返回或推送审核
 * @param request 包含投稿内容的请求
 * @returns 渲染后的 PNG 图片
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 连接数据库并解析请求体
    await dbConnect();
    // 鉴权
    const user = await authApi(request);
    if (!user) {
      return NextResponse.json({
        code: -4,
        message: 'Unauthorized'
      }, { status: 401 });
    }
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
    // 1. 根据 cid 查找或创建记录
    if (body.cid) {
      draft = await Draft.findById(body.cid);
      if (!draft) {
        return NextResponse.json({
          code: -1,
          message: `未找到该记录`
        }, { status: 404 });
      }
      if (body.content) {
        draft.content = body.content;
      }
    } else {
      draft = new Draft(body);
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
    // 判断投稿
    const isAtt = body.type === 'post';
    // 3. 调用渲染函数
    const result: Buffer | string = await toRender(
      draft.content,
      draft.timestamp,
      outputType,
      isAtt
    );
    // Buffer
    if (Buffer.isBuffer(result)) {
      const uint8Array = new Uint8Array(result);
      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
        },
      });
    }
    // HTML
    if (outputType === 'html' && typeof result === 'string') {
      return new NextResponse(result as string, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    // 4. 投稿相关
    if (isAtt) {
      draft.images = [];
      draft.images.push(result);
      draft.type = 'pending';
      if (draft.sender.platform.length === 0) {
        draft.sender.platform = option.default_platform;
      }
      await draft.save();
      // 推送审核
      const aid = option.review_push_platform;
      const account = aid ? await Account.findOne({ aid }) : null;
      if (account) {
        console.log('[Render] 推送审核');
        const [pushImage] = await getFile([result as string], 'base64');
        const pushResult = await pushReview(account, draft, pushImage, option);
        return NextResponse.json({
          code: 0,
          message: '渲染完成并已推送待审',
          data: {
            cid: draft._id,
            fid: result,
            timestamp: draft.timestamp,
            result: pushResult
          }
        });
      }
      console.warn('[Render] 跳过推送审核：未配置 review_push_platform 或对应账号不存在');
      return NextResponse.json({
        code: 0,
        message: '渲染完成（未配置推送平台，跳过审核推送）',
        data: {
          cid: draft._id,
          fid: result,
          timestamp: draft.timestamp
        }
      });
    }
    return NextResponse.json({
      code: 0,
      message: '渲染完成',
      data: {
        cid: draft._id,
        base64: result
      }
    });
  } catch (error) {
    console.error('[Render] 渲染失败:', error);
    return NextResponse.json(
      { code: -1, message: '服务器内部错误', error: error instanceof Error ? error.message : '发生未知错误' },
      { status: 500 }
    );
  }
}
