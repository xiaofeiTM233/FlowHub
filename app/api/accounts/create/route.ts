// app/api/accounts/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authApi } from "@/lib/auth";
import dbConnect from '@/lib/db';
import Account from '@/models/accounts';

/**
 * 创建或更新平台账号
 * @param request 包含账号对象的请求体
 * @returns 操作结果及平台账号对象
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
  const { platform, aid, auth, uid, cookies, stats } = await request.json();
  // 查找并更新账号
  const theAccount = await Account.findOneAndUpdate(
    { aid },
    { platform, aid, auth, uid, cookies, stats },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
  // 返回操作结果
  return NextResponse.json({
    code: 0,
    message: '平台账号已更新',
    account: theAccount
  }, { status: 200 });
}
