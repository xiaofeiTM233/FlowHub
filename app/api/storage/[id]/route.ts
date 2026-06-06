// app/api/storage/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFile } from '@/lib/storage';

/**
 * 根据附件 ID 返回原始文件。
 * 用于前端 Image 组件的 src，替代 data:base64 URI。
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const buffer = await getFile(id);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
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
