// app/api/posts/review/route.ts
import dbConnect from '@/lib/db';
import Post from '@/models/posts';

/**
 * 获取帖子的审核信息
 * @param request 请求应包含查询参数 pid
 * @returns 帖子的 review 字段内容
 */
export async function GET(request: Request) {
  try {
    // 获取 pid
    const searchParams = new URLSearchParams(request.url.split('?')[1]);
    const pid = searchParams.get('pid');
    // 1. 验证参数
    if (!pid) {
      return Response.json({ code: -1, message: "缺少参数" }, { status: 400 });
    }
    await dbConnect();
    // 2. 根据 pid (即 _id) 查找帖子
    const post = await Post.findById(pid);
    if (!post) {
      return Response.json({ code: -1, message: `未找到ID为 ${pid} 的帖子` }, { status: 404 });
    }
    // 3. 返回帖子的 review 内容
    return Response.json({
      code: 0,
      message: "获取审核信息成功",
      data: post.review.stat || {} // 如果 review 字段不存在，返回一个空对象
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
 * @param request 请求体包含 pid, action 和其他可能的参数
 * @returns 操作结果
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    await dbConnect();
    let mid = body.auth.mid;
    let action = body.action;
    let reason = body.data.reason || '无理由';
    let pid = body.data.pid;

    let result = '';
    let post;
    post = await Post.findById(pid);
    if (!post) {
      return Response.json({ code: -1, message: `未找到ID为 ${pid} 的帖子` }, { status: 404 });
    }
    if (post.type !== 'pending' && action !== 'retrial') {
      return Response.json({ code: -1, message: `ID为 ${pid} 的帖子不在审核状态` }, { status: 400 });
    }
    console.log(`[Review] 版主 ${mid} 对帖子 ${pid} 执行操作: ${action}，理由: ${reason}`);
    // 判断是否重审，如果是重审，则清空之前的投票记录
    if (action !== 'retrial') {
      post.review.approve = [];
      post.review.reject = [];
    } else {
      // 非重审，移除当前版主的投票记录
      post.review.approve = post.review.approve.filter((i: {mid: string}) => i.mid !== mid);
      post.review.reject = post.review.reject.filter((i: {mid: string}) => i.mid !== mid);
    }
    // 根据 action 执行不同的函数逻辑
    switch (action) {
      case 'retrial':
        post.type = 'pending';
        post.review.comments.push({mid, reason: `重审：${reason}`});
        result = `对帖子 ${pid} 执行：重审`;
        break;
      case 'approve':
        post.review.approve.push({mid, reason});
        result = `对帖子 ${pid} 投票：通过`;
        break;
      case 'reject':
        post.review.reject.push({mid, reason});
        result = `对帖子 ${pid} 投票：拒绝`;
        break;
      case 'approveforce':
        post.type = 'approved';
        // 还没写通过逻辑
        post.review.comments.push({mid, reason: `强制通过：${reason}`});
        result = `对帖子 ${pid} 执行：强制通过`;
        break;
      case 'rejectforce':
        post.type = 'rejected';
        // 还没写拒绝逻辑
        post.review.comments.push({mid, reason: `强制拒绝：${reason}`});
        result = `对帖子 ${pid} 执行：强制拒绝`;
        break;
      case 'block':
        post.type = 'rejected';
        post.review.comments.push({mid, reason: `拉黑：${reason}`});
        // 还没写拉黑逻辑
        result = `对帖子 ${pid} 执行：拉黑`;
        break;
      case 'raw':
        let data;
        // 还没写预览逻辑
        return Response.json({ code: 0, message: `获取预览`, data }, { status: 200 });
      default:
        return Response.json({ code: -1, message: `不支持的操作: ${action}` }, { status: 400 });
    }
    post.review.stat.approve = post.review.approve.length || 0;
    post.review.stat.reject = post.review.reject.length || 0;
    if (process.env.APPROVE_NUM && parseInt(process.env.APPROVE_NUM) > 0 && post.review.stat.approve >= parseInt(process.env.APPROVE_NUM)) {
      post.type = 'approved';
      // 还没写通过逻辑
    }
    if (process.env.REJECT_NUM && parseInt(process.env.REJECT_NUM) > 0 && post.review.stat.reject >= parseInt(process.env.REJECT_NUM)) {
      post.type = 'rejected';
      // 还没写拒绝逻辑
    }
    if (process.env.TOTAL_NUM && parseInt(process.env.TOTAL_NUM) > 0 && (post.review.stat.approve - post.review.stat.reject) >= parseInt(process.env.TOTAL_NUM)) {
      post.type = 'approved';
      // 还没写通过逻辑
    }
    await post.save();

    // 返回响应
    return Response.json({
      code: 0,
      message: result,
      data: post.review
    }, { status: 200 });

  } catch (error: any) {
    console.error('执行审核操作失败:', error);
    return Response.json({
      code: -1,
      message: error.message || '服务器内部错误'
    }, { status: 500 });
  }
}