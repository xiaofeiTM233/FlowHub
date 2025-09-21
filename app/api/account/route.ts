// app/api/account/route.ts
import dbConnect from '@/lib/db';
import Account from '@/models/account';

/**
 * 获取所有平台账号
 * @returns 平台账号数组
 *
export async function GET() {
  await dbConnect();
  const accounts = await Account.find();
  return Response.json(accounts);
}/

/**
 * 更新平台账号
 * @param request 包含 platform, aid, uid, cookies 字段的请求体
 * @returns 操作结果及平台账号对象
 */
export async function POST(request: Request) {
  await dbConnect();
  const { platform, aid, uid, cookies } = await request.json();

  const theAccount = await Account.findOneAndUpdate(
    { aid },
    { platform, aid, uid, cookies },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  return Response.json({ code: 0, message: '平台账号已更新', account: theAccount }, { status: 200 });
}
