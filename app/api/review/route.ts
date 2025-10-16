// app/api/drafts/review/route.ts
import Draft from '@/models/drafts';
import Post from '@/models/posts';
import Account from '@/models/accounts';
import Option from '@/models/options';
import { pushReview, getTags } from '@/lib/review';
import dbConnect from '@/lib/db';
import { publish } from '@/lib/publish';

/**
 * 获取帖子的审核信息
 * @param request 请求应包含查询参数 cid
 * @returns 帖子的 review 字段内容
 */
export async function GET(request: Request) {
  try {
    // 获取 cid
    const searchParams = new URLSearchParams(request.url.split('?')[1]);
    const cid = searchParams.get('cid');
    // 1. 验证参数
    if (!cid) {
      return Response.json({
        code: -1,
        message: "缺少参数"
      }, { status: 400 });
    }
    await dbConnect();
    // 2. 根据 cid (即 _id) 查找帖子
    const draft = await Draft.findById(cid);
    if (!draft) {
      return Response.json({
        code: -1,
        message: `未找到ID为 ${cid} 的帖子`
      }, { status: 404 });
    }
    // 3. 返回帖子的 review 内容
    return Response.json({
      code: 0,
      message: "获取审核信息成功",
      data: draft.review.stat || {} // 如果 review 字段不存在，返回一个空对象
    }, { status: 200 });
  } catch (error: any) {
    console.error('获取审核信息失败:', error);
    return Response.json({
      code: -1,
      message: error.message || '服务器内部错误'
    }, { status: 500 });
  }
}

/**
 * 对帖子执行审核操作
 * @param request 请求体包含 cid, action 和其他可能的参数
 * @returns 操作结果
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    await dbConnect();
    
    // 获取配置选项
    let option = await Option.findById('000000000000000000000000');
    if (!option) {
      // 如果不存在默认配置，创建一个
      option = new Option({ _id: '000000000000000000000000' });
    }
    
    let mid = body.auth.mid;
    let action = body.action;
    let reason = body.data.reason || '无理由';
    let cid = body.data.cid;

    let result = '';
    let draft;
    try {
      if (cid) {
        draft = await Draft.findById(cid); 
      } else if (body.data.timestamp) {
        draft = await Draft.findOne({timestamp: body.data.timestamp});
      }
      cid = draft._id;
    } catch(e) {
      return Response.json({
        code: -1,
        message: `未找到ID为 ${cid || body.data.timestamp} 的帖子`
      }, { status: 404 });
    }
    if (draft.type !== 'pending' && action !== 'retrial') {
      return Response.json({
        code: -1,
        message: `ID为 ${cid} 的帖子不在审核状态`
      }, { status: 400 });
    }
    console.log(`[Review] 版主 ${mid} 对帖子 ${cid} 执行操作: ${action}，理由: ${reason}`);
    // 判断是否重审，如果是重审，则清空之前的投票记录
    if (action !== 'retrial') {
      draft.review.approve = [];
      draft.review.reject = [];
    } else {
      // 非重审，移除当前版主的投票记录
      draft.review.approve = draft.review.approve.filter((i: {mid: string}) => i.mid !== mid);
      draft.review.reject = draft.review.reject.filter((i: {mid: string}) => i.mid !== mid);
    }
    // 根据 action 执行不同的函数逻辑
    switch (action) {
      case 'retrial': // 重审
        draft.type = 'pending';
        draft.review.comments.push({mid, reason: `重审：${reason}`});
        result = `对帖子 ${cid} 执行：重审`;
        break;
      case 'approve': // 通过
        draft.review.approve.push({mid, reason});
        result = `对帖子 ${cid} 投票：通过`;
        break;
      case 'reject': // 拒绝
        draft.review.reject.push({mid, reason});
        result = `对帖子 ${cid} 投票：拒绝`;
        break;
      case 'approveforce': // 强制通过
        draft.type = 'approved';
        draft.review.comments.push({mid, reason: `强制通过：${reason}`});
        result = `对帖子 ${cid} 执行：强制通过`;
        break;
      case 'rejectforce': // 强制拒绝
        draft.type = 'rejected';
        draft.review.comments.push({mid, reason: `强制拒绝：${reason}`});
        result = `对帖子 ${cid} 执行：强制拒绝`;
        break;
      case 'block': // 拉黑
        draft.type = 'rejected';
        draft.review.comments.push({mid, reason: `拉黑：${reason}`});
        // 还没写拉黑逻辑
        result = `对帖子 ${cid} 执行：拉黑`;
        break;
      case 'comment': // 评论
        draft.review.comments.push({mid, reason});
        // 还没写评论推送
        result = `对帖子 ${cid} 评论：${reason}`;
        break;
      case 'raw': // 获取原始内容
        const raw = draft.content;
        return Response.json({
          code: 0,
          message: `获取原始内容`,
          data: raw
        }, { status: 200 });
      case 'num': // 设置编号
        const num = body.data.num;
        if (typeof num !== 'number' || isNaN(num) || !Number.isInteger(num) || num <= 0) {
          return Response.json({
            code: -1,
            message: `编号必须是一个大于 0 的整数`,
            data: { error_number: num }
          }, { status: 400 });
        }
        option.last_number = num;
        draft.num = num;
        await draft.save();
        return Response.json({
          code: 0,
          message: `已设定上次编号和当前稿件编号为${num}${option.publish_direct ? '，请尽快发布该帖子避免编号顺序异常' : ''}`,
          data: { last_number: num }
        }, { status: 200 });
      case 'togglenick': // 切换匿名
        draft.sender.nick = !draft.sender.nick;
        if (draft.sender.nick) {
          draft.content.nickname = '匿名用户';
          draft.content.userid = 10000;
        } else {
          draft.content.nickname = draft.sender.nickname;
          draft.content.userid = draft.sender.userid;
        }
        await draft.save();
        return Response.json({
          code: 0,
          message: `已切换 ${draft._id} 稿件为${draft.nick ? '匿名' : '非匿名'}，请考虑重新渲染稿件`
        }, { status: 200 });
      case 'sender': // 获取发帖人信息
        const sender = draft.sender;
        return Response.json({
          code: 0,
          message: `获取原始内容`,
          data: sender
        }, { status: 200 });
      case 'tag': // 获取标签
        if (process.env.REVIEW_TAG_URL) {
          const tags = await getTags(draft.content);
          draft.tags = tags.data;
          await draft.save();
          return Response.json({
            code: 0,
            message: `获取标签`,
            data: tags.data
          }, { status: 200 });
        } else {
          return Response.json({
            code: -1,
            message: `未配置 AI 标签服务`
          }, { status: 400 });
        }
      case 'repush': // 重新推送审核
        const aid = option.review_push_platform;
        const account = await Account.findOne({ aid });
        const repush = await pushReview(account, draft, draft.images[0], option);
        return Response.json({
          code: 0,
          message: `已重新推送投稿 ${draft._id}`,
          data: repush
        }, { status: 200 });
      default: // 默认返回错误
        return Response.json({
          code: -1,
          message: `不支持的操作: ${action}`
        }, { status: 400 });
    }
    // 审核相关操作，计算票数
    draft.review.stat.approve = draft.review.approve.length || 0;
    draft.review.stat.reject = draft.review.reject.length || 0;
    if ((option.approve_num && option.approve_num > 0 && draft.review.stat.approve >= option.approve_num) ||
      (option.total_num && option.total_num > 0 && (draft.review.stat.approve - draft.review.stat.reject) >= option.total_num)) {
      draft.type = 'approved';
    }
    if ((option.reject_num && option.reject_num > 0 && draft.review.stat.reject >= option.reject_num) ||
    (option.total_num && option.total_num > 0 && (draft.review.stat.reject - draft.review.stat.approve) >= option.total_num)) {
      draft.type = 'rejected';
    }

    let results = draft.results || {};
    // 判断是否直接发布
    if (draft.type === 'approved') {
      console.log(`[Review] 达成发帖条件，创建 ${draft._id} 为投稿`)
      let post = new Post({ draft });
      post.type = 'pending';
      post.sender.platform = draft.sender.platform;
      post.cid = draft._id;
      for (const i of draft.images) {
        // 将审核图片添加到投稿图片中
        post.content.images.push(i);
      }
      if (draft.num === 0) {
        option.last_number++;
        draft.num = option.last_number;
      }
      draft.pid = post._id;
      // 还没写通过后的推送
      if (option.publish_direct) {
        console.log(`[Review] 达成发帖条件，推送发布：${draft._id}`)
        results = await publish(post);
        post.type = 'published';
        post.results = results;
        post.markModified && draft.markModified('results');
      }
      await post.save();
    }

    // 判断是否被拒绝
    if (draft.type === 'rejected') {
      console.log(`[Review] 帖子被拒绝：${draft._id}`)
      // 可能后续还要写拒绝后的推送，不过我觉得我应该先完善用户端甚至先做好网页端
    }
    await draft.save();
    await option.save();

    // 返回响应
    return Response.json({
      code: 0,
      message: result,
      data: draft.review,
      ...(results ? { results } : {})
    }, { status: 200 });

  } catch (error: any) {
    console.error('执行审核操作失败:', error);
    return Response.json({
      code: -1,
      message: error.message || '服务器内部错误'
    }, { status: 500 });
  }
}