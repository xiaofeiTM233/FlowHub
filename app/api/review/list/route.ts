import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Draft from '@/models/drafts';
import mongoose from 'mongoose';

/**
 * 草稿数据类型定义
 */
type DraftType = any; 

/**
 * 获取审核列表数据
 * 支持分页、筛选和搜索功能
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = request.nextUrl;
    // 分页参数
    const current = parseInt(searchParams.get('current') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    // 筛选参数
    const publisher = searchParams.get('publisher');
    const type = searchParams.get('type');
    const isAnonymous = searchParams.get('sender.nick');
    const timeRange = searchParams.get('createdAt');
    // 构建查询条件
    const filter: mongoose.FilterQuery<DraftType> = {};
    // 发布者搜索（支持用户ID和昵称）
    if (publisher) {
      const isNumeric = /^\d+$/.test(publisher);
      filter.$or = [
        { 'content.nickname': { $regex: publisher, $options: 'i' } },
      ];
      if (isNumeric) {
        filter.$or.push({ 'content.userid': Number(publisher) });
      }
    }
    // 审核状态筛选
    if (type) {
      filter.type = type;
    }
    // 匿名状态筛选
    if (isAnonymous) {
      filter['sender.nick'] = isAnonymous === 'true';
    }
    // 时间范围筛选
    if (timeRange) {
      try {
        const [start, end] = JSON.parse(timeRange);
        if (start && end) {
          filter.createdAt = { 
            $gte: new Date(start), 
            $lte: new Date(end) 
          };
        }
      } catch (error) {
        console.error('[ReviewList] 时间范围解析失败:', error);
      }
    }

    // 执行数据库查询
    const total = await Draft.countDocuments(filter);
    let records = await Draft.find(filter)
      .sort({ createdAt: -1 })
      .skip((current - 1) * pageSize)
      .limit(pageSize)
      .lean();
    for (const i of records) {
      i.nick = i.sender.nick;
      delete i.sender;
      i.stat = i.review.stat;
      delete i.review;
      delete i.content.list;
    }
    return NextResponse.json({
      data: records,
      total,
      success: true,
    });
  } catch (error) {
    console.error('[ReviewList] 获取审核列表失败:', error);
    return NextResponse.json({ 
        success: false, 
        message: '服务器内部错误' 
      },{ status: 500 }
    );
  }
}