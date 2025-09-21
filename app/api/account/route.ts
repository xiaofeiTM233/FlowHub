// app/api/account/route.ts
import dbConnect from '@/lib/db';
import Account from '@/models/account';
import { biliStat } from '@/lib/adapter/bili';
import { qzoneStat } from '@/lib/adapter/qzone';

/**
 * 获取并更新所有平台账号的stat
 * @returns 平台账号数组
 */
export async function GET() {
  await dbConnect();
  const accounts = await Account.find();
  const stats = {};
  for (const account of accounts) {
    let stat;
    if (account.platform === 'bili') {
      stat = await biliStat(account);
    } else if (account.platform === 'qzone') {
      stat = await qzoneStat(account);
    }
    account.stats = stat;
    await account.save();
    stats[account.aid] = stat;
  }
  return Response.json({ code: 0, message: '已获取并更新所有账号的统计信息', data: stats }, { status: 200 });
}

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
