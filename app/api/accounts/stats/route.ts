// app/api/accounts/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { biliStat } from '@/lib/adapter/bili';
import { qzoneStat } from '@/lib/adapter/qzone';
import dbConnect from '@/lib/db';
import Account from '@/models/accounts';

/**
 * 获取并更新所有平台账号的统计信息
 * @returns 平台账号的统计信息
 */
export async function GET(request: NextRequest) {
  await dbConnect();
  // 解析查询参数：支持按平台筛选
  const aids = (() => {
    const param = new URL(request.url).searchParams.get('platform');
    return param ? param.split(',').map(s => s.trim()).filter(Boolean) : null;
  })();
  // 获取账号列表：支持筛选或获取全部
  const accounts = aids ? await Account.find({ aid: { $in: aids } }) : await Account.find();
  // 遍历账号并更新统计信息
  const stats: { [key: string]: any } = {};
  for (const account of accounts) {
    let stat;
    // 根据平台类型调用对应的统计接口
    if (account.platform === 'bili') {
      stat = await biliStat(account);
    } else if (account.platform === 'qzone') {
      stat = await qzoneStat(account);
    }
    // 更新账号统计信息并保存
    account.stats = stat;
    await account.save();
    stats[account.aid] = stat;
  }
  // 返回统计结果
  return NextResponse.json({
    code: 0,
    message: '已获取并更新账号统计信息',
    data: stats
  }, { status: 200 });
}
