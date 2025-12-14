// app/api/options/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authApi } from "@/lib/auth";
import dbConnect from '@/lib/db';
import Option from '@/models/options';

/**
 * 获取设置信息
 * @param request 请求对象
 * @returns 设置的信息
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
    // 查找设置
    const option = await Option.findById('000000000000000000000000');
    if (!option) {
      return NextResponse.json({
        code: -1,
        message: `未找到设置，请先初始化设置`
      }, { status: 404 });
    }
    const theOption = option;
    // 返回设置内容
    return NextResponse.json({
      code: 0,
      message: "获取设置信息成功",
      data: theOption || {}
    }, { status: 200 });
  } catch (error: any) {
    console.error('获取设置信息失败:', error);
    return NextResponse.json({
      code: -1,
      message: error.message || '服务器内部错误'
    }, { status: 500 });
  }
}

/**
 * 更新平台设置
 * @param request 包含设置对象的请求体
 * @returns 操作结果及平台设置对象
 */
export async function POST(request: NextRequest) {
  await dbConnect();
  // 鉴权
  const user = await authApi(request);
  if (!user || user.role !== 'sysop') {
    return NextResponse.json({
      code: -4,
      message: 'Unauthorized'
    }, { status: 401 });
  }
  // 解析请求参数
  const { data } = await request.json();
  // 查找并更新设置
  const theOption = await Option.findOneAndUpdate(
    { _id: '000000000000000000000000' },
    { $set: data }
  );
  // 返回操作结果
  return NextResponse.json({
    code: 0,
    message: '设置已更新',
    data: theOption
  }, { status: 200 });
}
