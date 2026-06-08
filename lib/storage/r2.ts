// lib/storage/r2.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import type { StorageAdapter, SaveResult, StorageConfig } from './types';

/**
 * Cloudflare R2 适配器
 *
 * 凭证通过构造参数传入，由前端在设置页面配置后存入 Options。
 */
export class R2Adapter implements StorageAdapter {
  readonly type = 'r2' as const;

  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(config: StorageConfig) {
    this.bucket = config.r2Bucket || '';
    this.publicUrl = config.r2PublicUrl || '';

    if (!config.r2AccessKeyId || !config.r2SecretAccessKey || !config.r2Endpoint || !this.bucket) {
      throw new Error('R2 凭证未完整配置，请在系统设置中填写所有必填项');
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: config.r2Endpoint,
      credentials: {
        accessKeyId: config.r2AccessKeyId,
        secretAccessKey: config.r2SecretAccessKey
      },
      forcePathStyle: false
    });
  }

  async save(filename: string, buffer: Buffer, format: string): Promise<SaveResult> {
    const key = `${Date.now()}-${filename}`;
    const contentType = formatToMime(format);

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType
    }));

    const src = this.publicUrl
      ? `${this.publicUrl.replace(/\/+$/, '')}/${key}`
      : key;

    return { src, size: buffer.length };
  }

  async load(src: string): Promise<Buffer> {
    const key = src.includes('://')
      ? new URL(src).pathname.replace(/^\//, '')
      : src;

    const response = await this.client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    }));

    if (!response.Body) {
      throw new Error(`R2 下载失败: 对象 ${key} 不存在或无内容`);
    }

    return Buffer.from(await response.Body.transformToByteArray());
  }

  async remove(src: string): Promise<void> {
    const key = src.includes('://')
      ? new URL(src).pathname.replace(/^\//, '')
      : src;

    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key
    }));
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
