// lib/storage/base64.ts
import type { StorageAdapter, SaveResult } from './types';

/**
 * Base64 适配器
 *
 * 文件数据以 base64 字符串形式存储在 MongoDB attachment 文档的 src 字段中。
 * 适用于小文件、开发调试阶段，无需额外云服务依赖。
 *
 * 注意：MongoDB 单文档限制 16MB，base64 编码会膨胀约 33%，
 * 单个文件建议不超过 10MB 原始数据。
 */
export class Base64Adapter implements StorageAdapter {
  readonly type = 'base64' as const;

  async save(_filename: string, buffer: Buffer): Promise<SaveResult> {
    const base64 = buffer.toString('base64');
    return {
      src: base64,
      size: buffer.length
    };
  }

  async load(src: string): Promise<Buffer> {
    return Buffer.from(src, 'base64');
  }

  async remove(_src: string): Promise<void> {
    // base64 数据随 MongoDB 文档一同删除，此方法为 no-op
  }
}
