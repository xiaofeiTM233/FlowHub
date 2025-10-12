// app/api/posts/delete/route.ts
import { biliDelete } from '@/lib/adapter/bili';
import { qzoneDelete } from '@/lib/adapter/qzone';
import dbConnect from '@/lib/db';
import Account from '@/models/accounts';
import Post from '@/models/posts';

/**
 * 根据帖子的 _id 删除其在各个平台发布的动态
 * @param request 包含帖子 _id 的 POST 请求
 * @returns 各平台删除结果
 */
export async function POST(request: Request) {
  await dbConnect();
  const body = await request.json();
  const { _id } = body;

  // 1. 检查请求体中是否包含 _id
  if (!_id) {
    return Response.json({
      code: -1,
      message: "缺少 _id 参数"
    }, { status: 400 });
  }

  // 2. 根据 _id 查找帖子
  const post = await Post.findById(_id);
  if (!post) {
    return Response.json({
      code: -1,
      message: `未找到该帖子`
    }, { status: 404 });
  }

  // 如果帖子已经是删除状态，可以提前返回
  if (post.type === 'deleted') {
    return Response.json({
      code: 1,
      message: "该帖子已被删除"
    }, { status: 200 });
  }

  const results = post.results || {};
  let deleteResults: { [key: string]: any } = {};

  // 3. 遍历已发布的平台并执行删除操作
  for (const aid in results) {
    // 获取单个 aid 的 result
    const result = results[aid];
    const account = await Account.findOne({ aid });
    let tid: string | undefined;
    // 根据平台类型，从 result.data 中提取相应的 ID
    if (account.platform === 'bili') {
      tid = result.data.dyn_id_str;
    } else if (account.platform === 'qzone') {
      tid = result.data.t1_tid;
    }
    // 如果成功提取到 ID，则调用删除函数
    if (tid) {
      if (account.platform === 'bili') {
        deleteResults[aid] = await biliDelete(account, tid);
      } else if (account.platform === 'qzone') {
        deleteResults[aid] = await qzoneDelete(account, tid);
      }
    } else {
      // 如果没有找到对应的 ID，则记录为错误
      deleteResults[aid] = { platform: account.platform, status: 'error', message: '未能在发布结果中找到用于删除的ID' };
    }
  }

  // 4. 更新数据库中帖子的状态为 "deleted"
  post.type = 'deleted';
  await post.save();

  // 5. 返回处理结果
  return Response.json({
    code: 0,
    message: "删除成功",
    data: deleteResults
  }, { status: 200 });
}
