// app/api/publish/route.ts
import dbConnect from '@/lib/db';
import { publish } from '@/lib/publish';
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
      return Response.json({ code: -1, message: `未找到该帖子` }, { status: 404 });
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

  // 2. 遍历平台发布
  const results = await publish(post);
  
  // 如果是已发布状态，直接返回结果
  if (post.type === 'published') {
    return Response.json({ code: 1, message: "published", data: results }, { status: 200 });
  }

  // 3. 更新数据库中帖子
  post.type = 'published';
  post.results = results;
  post.markModified && post.markModified('results');
  await post.save();
  // 4. 返回处理结果
  return Response.json({ code: 0, message: "success", data: results }, { status: 200 });
}
