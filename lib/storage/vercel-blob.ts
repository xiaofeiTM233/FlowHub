// lib/storage/vercel-blob.ts
import { put, del } from '@vercel/blob';
import type { StorageAdapter, SaveResult, StorageConfig } from './types';

/**
 * Vercel Blob 适配器
 *
 * 文件上传至 Vercel Blob（底层 AWS S3），返回公开可访问的 URL。
 *
 * 凭证通过构造参数传入，由前端在设置页面配置后存入 Options → 服务端读取。
 */
export class VercelBlobAdapter implements StorageAdapter {
  readonly type = 'vercel' as const;

  constructor(config: StorageConfig) {
    if (!config.vercelToken) {
      throw new Error('Vercel Blob Token 未配置，请在系统设置中填写');
    }
    // @vercel/blob 通过 BLOB_READ_WRITE_TOKEN 环境变量认证，
    // 这里临时注入到 process.env 以兼容 SDK（SDK 不支持参数传入 token）
    process.env.BLOB_READ_WRITE_TOKEN = config.vercelToken;
  }

  async save(filename: string, buffer: Buffer, format: string): Promise<SaveResult> {
    const contentType = formatToMime(format);
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: true
    });

    return {
      src: blob.url,
      size: buffer.length
    };
  }

  async load(src: string): Promise<Buffer> {
    const res = await fetch(src);
    if (!res.ok) {
      throw new Error(`Vercel Blob 下载失败: ${res.status} ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async remove(src: string): Promise<void> {
    await del(src);
  }
}

function formatToMime(format: string): string {
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    mp4: 'video/mp4',
    webm: 'video/webm'
  };
  return mimeMap[format] || 'application/octet-stream';
}
