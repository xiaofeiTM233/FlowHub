// app/api/publish/route.ts
import { biliDelete, biliStat, biliPlus } from '@/lib/adapter/bili';
import { qzoneDelete, qzoneBlock, qzonePlus } from '@/lib/adapter/qzone';
import dbConnect from '@/lib/db';
import Account from '@/models/account';
import Post from '@/models/posts';

/**
 * 根据 _id 或请求体内容发布动态
 * @param request 包含 _id 或完整帖子内容的请求体
 * @returns 各平台发布结果
 */
export async function POST(request: Request) {
  await dbConnect();
  const body = await request.json();
  let post;

  // 1. 根据 _id 查找或创建帖子
  if (body._id) {
    post = await Post.findById(body._id);
    if (!post) {
      return Response.json({ message: `未找到该帖子` }, { status: 404 });
    }
  } else {
    post = new Post({
      type: body.type || 'draft',
      timestamp: body.timestamp,
      sender: body.sender,
      content: body.content,
      results: {}
    });
    await post.save();
  }

  const { sender, content, type } = post;

  // 2. 遍历平台发布
  let results = post.results || {};
  // 已发布则跳过
  if (type === 'published') {
    return Response.json({ code: 0, message: "published", data: results }, { status: 200 });
  }

  // 遍历平台发布
  for (const aid of sender.platform) {
    // 已发布则跳过
    if (results[aid]?.status === 'success') continue;
    const account = await Account.findOne({ aid });

    if (account.platform === 'bili') {
      // bili
      results[aid] = await biliPlus(account, content);
    } else if (account.platform === 'qq') {
      // qzone
      results[aid] = await qzonePlus(account, content);
    } else {
      results[aid] = { platform: account.platform, status: 'error', message: '不支持的平台' };
    }
  }

  // 3. 更新数据库中帖子
  post.type = 'published';
  post.results = results;
  post.markModified && post.markModified('results');
  await post.save();
  // 4. 返回处理结果
  return Response.json({ code: 0, message: "success", data: results }, { status: 200 });
}