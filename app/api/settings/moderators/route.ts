// app/api/settings/moderators/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from '@/lib/db';
import Moderator from '@/models/moderators';
import mongoose from 'mongoose';
import { authApi } from '@/lib/auth';

/*
 * 审核员数据类型
 */
type ModeratorType = any;

/*
 * 查询审核员列表
 */
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
    const mid = searchParams.get('mid');
    const role = searchParams.get('role');
    const timeRange = searchParams.get('updatedAt') || searchParams.get('createdAt');

    const filter: mongoose.FilterQuery<ModeratorType> = {};
    if (mid) filter.mid = { $regex: mid, $options: 'i' };
    if (role) filter.role = { $regex: role, $options: 'i' };

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
        console.error('[Moderator] 时间范围解析失败', e);
      }
    }

    const total = await Moderator.countDocuments(filter);
    let records = await Moderator.find(filter)
      .sort({ updatedAt: -1 })
      .skip((current - 1) * pageSize)
      .limit(pageSize)
      .lean();

    records = records.map((r: any) => ({
      _id: r._id,
      mid: r.mid,
      role: r.role,
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
    console.error('[Moderator] 获取审核员列表失败', error);
    return NextResponse.json({
      code: -1,
      message: '服务器内部错误'
    }, { status: 500 });
  }
}

/*
 * 创建或更新审核员
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
  const { mid, role, key } = await request.json();
  const set: any = {
    role: role
  };
  if (typeof key !== 'undefined') set.key = key;
  // 查找并更新审核员
  const theModerator = await Moderator.findOneAndUpdate(
    { mid },
    { $set: set, $setOnInsert: { mid } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
  // 返回操作结果
  return NextResponse.json({
    code: 0,
    message: '审核员已更新',
    data: theModerator
  }, { status: 200 });
}
