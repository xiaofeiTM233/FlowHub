// app/api/account/stats/route.ts
import dbConnect from '@/lib/db';
import Account from '@/models/account';
import { biliStat } from '@/lib/adapter/bili';
import { qzoneStat } from '@/lib/adapter/qzone';

/**
 * 获取并更新所有平台账号的统计信息
 * @returns 平台账号的统计信息
 */
export async function GET(request: Request) {
  await dbConnect();
  const aids = (() => {
    const param = new URL(request.url).searchParams.get('platform');
    return param ? param.split(',').map(s => s.trim()).filter(Boolean) : null;
  })();
  const accounts = aids ? await Account.find({ aid: { $in: aids } }) : await Account.find();
  const stats: { [key: string]: any } = {};
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
  return Response.json({ code: 0, message: '已获取并更新账号统计信息', data: stats }, { status: 200 });
}
