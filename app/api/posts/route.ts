// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authApi } from "@/lib/auth";
import dbConnect from '@/lib/db';
import Post from '@/models/posts';

/**
 * 获取帖子信息
 * @param request 请求应包含查询参数 id
 * @returns 帖子的信息
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    // 鉴权
    const user = await authApi(request);
    if (!user) {
      return NextResponse.json({
        code: -4,
        message: 'Unauthorized'
      }, { status: 401 });
    }
    // 获取 id
    const searchParams = new URLSearchParams(request.url.split('?')[1]);
    const id = searchParams.get('id');
    // 1. 验证参数
    if (!id) {
      return NextResponse.json({
        code: -1,
        message: "缺少参数"
      }, { status: 400 });
    }
    if (id === 'new') {
      // 如果是新建帖子，直接返回空白帖子
      return NextResponse.json({
        code: 0,
        message: "获取帖子信息成功（新建）",
        data: new Post()
      }, { status: 200 });
    }
    // 2. 根据 id 查找帖子
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({
        code: -1,
        message: `未找到ID为 ${id} 的帖子`
      }, { status: 404 });
    }
    const thePost = post;
    // 3. 返回帖子内容
    return NextResponse.json({
      code: 0,
      message: "获取帖子信息成功",
      data: thePost || {}
    }, { status: 200 });
  } catch (error: any) {
    console.error('获取帖子信息失败:', error);
    return NextResponse.json({
      code: -1,
      message: error.message || '服务器内部错误'
    }, { status: 500 });
  }
}

/**
 * 创建或更新帖子
 * @param request 包含帖子对象的请求体
 * @returns 操作结果及帖子对象
 */
export async function POST(request: NextRequest) {
  await dbConnect();
  // 鉴权
  const user = await authApi(request);
  if (!user || !['admin', 'sysop'].includes(user.role)) {
    return NextResponse.json({
      code: -4,
      message: 'Unauthorized'
    }, { status: 401 });
  }
  // 解析请求参数
  const { data } = await request.json();
  // 查找并更新帖子
  const thePost = await Post.findOneAndUpdate(
    { _id: data.pid },
    { $set: data },
    {
      new: true
    }
  );
  // 返回操作结果
  return NextResponse.json({
    code: 0,
    message: '帖子已更新',
    data: thePost
  }, { status: 200 });
}
