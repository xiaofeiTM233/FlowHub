import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Option from '@/models/options';
import Moderator from '@/models/moderators';

export async function GET() {
  try {
    // 1. 连接数据库
    await dbConnect();

    // 2. 查询 Option
    const TARGET_ID = '000000000000000000000000';
    const ifInit = await Option.findById(TARGET_ID);

    // 3. 已有默认配置，直接返回 444
    if (ifInit) {
      return new NextResponse(null, { status: 444 });
    }

    // 4. 没有配置，执行初始化逻辑
    console.log('⚙️ 初始化数据库...');

    // 4.1 创建 Option
    try {
      await Option.create({
        _id: TARGET_ID
      });
      await Moderator.create({
        mid: "10000",
        role: "sysop",
        key: "114514"
      });
    } catch (e) {}

    // 5. 返回成功响应
    return NextResponse.json({ message: '初始化完成' });
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    return NextResponse.json({ error: '初始化失败' }, { status: 500 });
  }
}

export async function POST() {
  return new NextResponse(null, { status: 444 });
}
