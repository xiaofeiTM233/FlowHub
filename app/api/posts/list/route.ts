// app/api/posts/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/posts';
import mongoose from 'mongoose';

/**
 * 帖子数据类型定义
 */
type PostType = any;

/**
 * 获取帖子列表数据
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
    const q = searchParams.get('q'); // 用于搜索正文
    const publisher = searchParams.get('publisher');
    const type = searchParams.get('type');
    const isAnonymous = searchParams.get('anonymous');
    const timeRange = searchParams.get('createdAt');
    const filter: mongoose.FilterQuery<PostType> = {};
    // 正文搜索
    if (q) {
      filter['content.text'] = { $regex: q, $options: 'i' };
    }
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
    // 发布状态筛选
    if (type) {
      filter.type = type;
    }
    // 匿名状态筛选
    if (isAnonymous) {
      filter['sender.anonymous'] = isAnonymous === 'true';
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
        console.error('[PostsList] 时间范围解析失败:', error);
      }
    }
    
    // 执行数据库查询
    const total = await Post.countDocuments(filter);
    let records = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((current - 1) * pageSize)
      .limit(pageSize)
      .lean();
    for (const i of records) {
      i.anonymous = i.sender?.anonymous || false;
      i.text = i.content?.text || '';
      i.images = i.content?.images || [];
      delete i.sender;
      delete i.content;
      delete i.results;
    }
    return NextResponse.json({
      code: 0,
      message: '成功',
      data: {
        records,
        total,
      },
    });
  } catch (error) {
    console.error('[PostsList] 获取帖子列表失败:', error);
    return NextResponse.json({ code: -1, message: '服务器内部错误' }, { status: 500 });
  }
}