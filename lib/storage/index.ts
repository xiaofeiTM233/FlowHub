// lib/storage/index.ts
import type { StorageAdapter, StorageType, AttachmentData, StorageConfig } from './types';
import { Base64Adapter } from './base64';
import { VercelBlobAdapter } from './vercel-blob';
import { R2Adapter } from './r2';
import { WebdavAdapter } from './webdav';
import dbConnect from '@/lib/db';
import Attachment from '@/models/attachments';
import Option from '@/models/options';

// ---- Options → StorageConfig 转换 ----

/**
 * 从 Option 文档中提取存储配置。
 * base64 是内置默认方案，不存储在数组中。
 * default_storage_platform 按 storage_platforms[].name 查找。
 */
async function loadConfig(): Promise<StorageConfig> {
  const opt = await Option.findById('000000000000000000000000');
  const platforms: any[] = opt?.storage_platforms || [];
  const defaultName = opt?.default_storage_platform || 'base64';

  // base64 是内置默认，不走数组查找
  if (defaultName === 'base64') {
    return { type: 'base64' };
  }

  // 按 name 字段匹配
  const platform = platforms.find((p: any) => p.name === defaultName);
  if (!platform) return { type: 'base64' };

  return {
    type: platform.type as StorageType,
    vercelToken: platform.token,
    r2AccessKeyId: platform.access_key_id,
    r2SecretAccessKey: platform.secret_access_key,
    r2Endpoint: platform.endpoint,
    r2Bucket: platform.bucket,
    r2PublicUrl: platform.public_url,
    webdavUrl: platform.url,
    webdavUser: platform.user,
    webdavPass: platform.pass,
    webdavBasePath: platform.base_path
  };
}

// ---- 适配器单例缓存 ----

let _adapter: StorageAdapter | null = null;

/**
 * 根据 StorageConfig 创建存储适配器实例。
 */
export function createAdapter(config: StorageConfig): StorageAdapter {
  switch (config.type) {
    case 'vercel':
      _adapter = new VercelBlobAdapter(config);
      break;
    case 'r2':
      _adapter = new R2Adapter(config);
      break;
    case 'webdav':
      _adapter = new WebdavAdapter(config);
      break;
    case 'base64':
    default:
      _adapter = new Base64Adapter();
      break;
  }
  return _adapter;
}

/**
 * 从 Options 加载配置并创建适配器。
 */
export async function getAdapter(): Promise<StorageAdapter> {
  await dbConnect();
  const config = await loadConfig();
  return createAdapter(config);
}

/** 重置适配器缓存，下次调用 getAdapter 时重新创建 */
export function resetAdapter(): void {
  _adapter = null;
}

// ---- 高层封装 ----

/**
 * 保存文件并创建附件记录。
 */
export async function saveFile(
  filename: string,
  buffer: Buffer,
  format: string,
  uploader: string = ''
): Promise<AttachmentData> {
  await dbConnect();
  const adapter = await getAdapter();
  const result = await adapter.save(filename, buffer, format);

  const doc = await Attachment.create({
    type: adapter.type,
    src: result.src,
    name: filename,
    format,
    uploader,
    size: result.size
  });

  return doc.toObject() as AttachmentData;
}

/**
 * getFile | 按附件 ID 读取文件，支持多种输出格式。
 */
export async function getFile(ids: string[], format: 'src' | 'buffer' | 'base64' = 'src'): Promise<(Buffer | string)[]> {
  if (ids.length === 0) return [];
  await dbConnect();

  const docs = await Attachment.find({ _id: { $in: ids } });
  const map = new Map(docs.map(d => [String(d._id), d]));
  const missing = ids.filter(id => !map.has(id));
  if (missing.length) throw new Error(`附件 ${missing.join(', ')} 不存在`);

  if (format === 'src') return ids.map(id => map.get(id)!.src);

  const adapter = await getAdapter();
  return Promise.all(ids.map(async id => {
    const doc = map.get(id)!;
    const data = doc.type === 'base64'
      ? Buffer.from(doc.src, 'base64')
      : await adapter.load(doc.src);
    return format === 'base64' ? data.toString('base64') : data;
  }));
}

/**
 * 删除附件记录及其远程文件。
 */
export async function delFile(attachmentId: string): Promise<void> {
  await dbConnect();

  const doc = await Attachment.findById(attachmentId);
  if (!doc) {
    throw new Error(`附件 ${attachmentId} 不存在`);
  }

  // 从存储中删除文件
  const adapter = await getAdapter();
  await adapter.remove(doc.src);

  // 从数据库删除记录
  await Attachment.findByIdAndDelete(attachmentId);
}

// 重新导出类型和类
export type { StorageAdapter, StorageType, AttachmentData, StorageConfig };
export { Base64Adapter, VercelBlobAdapter, R2Adapter, WebdavAdapter };
