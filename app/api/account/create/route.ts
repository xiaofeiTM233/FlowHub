// app/api/account/create/route.ts
import dbConnect from '@/lib/db';
import Account from '@/models/account';

/**
 * 创建或更新平台账号
 * @param request 包含账号对象的请求体
 * @returns 操作结果及平台账号对象
 */
export async function POST(request: Request) {
  await dbConnect();
  const { platform, aid, auth, uid, cookies, stats } = await request.json();

  const theAccount = await Account.findOneAndUpdate(
    { aid },
    { platform, aid, auth, uid, cookies, stats },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  return Response.json({ code: 0, message: '平台账号已更新', account: theAccount }, { status: 200 });
}
