// app/api/storage/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authApi } from '@/lib/auth';
import { saveFile, getFile } from '@/lib/storage';

/**
 * 获取文件
 *
 * 策略：
 * - vercel / r2 (有公开URL) → 302 重定向到 src，浏览器直连存储服务，零中转
 * - webdav / base64          → 服务端读取并返回 buffer（需认证或解码）
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 获取附件 ID
    const { id } = await params;
    const [meta] = await getFile([id], 'meta') as [{ type: string; src: string; format: string }];

    // vercel / r2 的 src 是公开可访问的 URL → 302 重定向，浏览器直连存储服务
    if ((meta.type === 'vercel' || meta.type === 'r2') && meta.src.startsWith('http')) {
      return NextResponse.redirect(meta.src, 302);
    }

    // webdav(需认证) / base64(需解码) → 服务端中转
    const [buffer] = await getFile([id], 'buffer');
    // 返回文件内容
    return new NextResponse(new Uint8Array(buffer as Buffer), {
      headers: {
        'Content-Type': `image/${meta.format}`,
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { code: -1, message: error.message || '文件不存在' },
      { status: 404 }
    );
  }
}

/**
 * 上传文件
 * @param request 请求对象
 * @returns 操作结果
 */
export async function POST(request: NextRequest) {
  try {
    // 鉴权
    const user = await authApi(request);
    if (!user || user.role !== 'sysop') {
      return NextResponse.json({
        code: -4,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    // 处理文件上传
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({
        code: -1,
        message: '缺少文件参数'
      }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        code: -1,
        message: '仅支持图片文件'
      }, { status: 400 });
    }

    // 将文件保存到存储后端
    const buffer = Buffer.from(await file.arrayBuffer());
    const format = file.type.split('/')[1] || 'png';
    const filename = `${Date.now()}-${file.name}`;
    const attachment = await saveFile(filename, buffer, format, user.id || 'unknown');

    // 返回操作结果
    return NextResponse.json({
      code: 0,
      message: '上传成功',
      data: attachment
    });
  } catch (error: any) {
    console.error('文件上传失败:', error);
    return NextResponse.json({
      code: -1,
      message: error.message || '服务器内部错误'
    }, { status: 500 });
  }
}
