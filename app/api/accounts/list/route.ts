// app/api/accounts/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Account from '@/models/accounts';
import mongoose from 'mongoose';
import { authApi } from '@/lib/auth';

/**
 * 账号数据类型
 */
type AccountType = any;

export async function GET(request: NextRequest) {
  // 鉴权
  const user = await authApi(request);
  if (!user) {
    return NextResponse.json({ code: -4, message: 'Unauthorized' }, { status: 401 });
  }
  try {
    await dbConnect();
    const { searchParams } = request.nextUrl;
    const current = parseInt(searchParams.get('current') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const platform = searchParams.get('platform');
    const aid = searchParams.get('aid');
    const uid = searchParams.get('uid');
    const timeRange = searchParams.get('updatedAt') || searchParams.get('createdAt');

    const filter: mongoose.FilterQuery<AccountType> = {};
    if (platform) filter.platform = { $regex: platform, $options: 'i' };
    if (aid) filter.aid = { $regex: aid, $options: 'i' };
    if (uid) filter.uid = { $regex: uid, $options: 'i' };

    if (timeRange) {
      try {
        const [start, end] = JSON.parse(timeRange);
        if (start && end) {
          filter.$or = [
            { updatedAt: { $gte: new Date(start), $lte: new Date(end) } },
            { createdAt: { $gte: new Date(start), $lte: new Date(end) } },
          ];
        }
      } catch (e) {
        console.error('[AccountList] 时间范围解析失败', e);
      }
    }

    const total = await Account.countDocuments(filter);
    let records = await Account.find(filter)
      .sort({ updatedAt: -1 })
      .skip((current - 1) * pageSize)
      .limit(pageSize)
      .lean();

    records = records.map((r: any) => ({
      _id: r._id,
      platform: r.platform,
      aid: r.aid,
      uid: r.uid,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      __v: (r as any).__v ?? 0,
    }));

    return NextResponse.json({
      code: 0,
      message: '成功',
      data: {
        records,
        total
      }
    });
  } catch (error) {
    console.error('[AccountList] 获取账号列表失败', error);
    return NextResponse.json({
      code: -1,
      message: '服务器内部错误'
    }, { status: 500 });
  }
}
