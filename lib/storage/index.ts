// lib/storage/index.ts
import type { StorageAdapter, StorageType, AttachmentData, StorageConfig } from './types';
import { Base64Adapter } from './base64';
import { VercelBlobAdapter } from './vercel-blob';
import { R2Adapter } from './r2';
import { WebdavAdapter } from './webdav';
import dbConnect from '@/lib/db';
import Attachment from '@/models/attachments';
import Option from '@/models/options';

/** 从 Option 文档读取存储配置 */
async function loadConfig(): Promise<StorageConfig> {
  const opt = await Option.findById('000000000000000000000000');
  const platforms: any[] = opt?.storage_platforms || [];
  const name = opt?.default_storage_platform || 'base64';
  // base64 是内置默认，不查数组
  if (name === 'base64') return { type: 'base64' };
  // 查找自定义平台配置
  const p = platforms.find((x: any) => x.name === name);
  if (!p) return { type: 'base64' };
  return {
    type: p.type as StorageType,
    vercelToken: p.token,
    r2AccessKeyId: p.access_key_id,
    r2SecretAccessKey: p.secret_access_key,
    r2Endpoint: p.endpoint,
    r2Bucket: p.bucket,
    r2PublicUrl: p.public_url,
    webdavUrl: p.url,
    webdavUser: p.user,
    webdavPass: p.pass,
    webdavBasePath: p.base_path,
  };
}

export function createAdapter(config: StorageConfig): StorageAdapter {
  switch (config.type) {
    case 'vercel':  return new VercelBlobAdapter(config);
    case 'r2':      return new R2Adapter(config);
    case 'webdav':  return new WebdavAdapter(config);
    default:        return new Base64Adapter();
  }
}

/** 加载配置并创建适配器实例 */
export async function getAdapter(): Promise<StorageAdapter> {
  await dbConnect();
  return createAdapter(await loadConfig());
}

/**
 * saveFile | 写入文件，返回附件元数据
 * @param filename 文件名
 * @param buffer 文件内容
 * @param format 文件格式（png/jpg 等）
 * @param uploader 上传者标识
 */
export async function saveFile(
  filename: string,
  buffer: Buffer,
  format: string,
  uploader: string
): Promise<AttachmentData> {
  await dbConnect();
  const adapter = await getAdapter();
  // 通过适配器写入存储后端
  const result = await adapter.save(filename, buffer, format);
  // 创建数据库记录
  const doc = await Attachment.create({
    type: adapter.type,
    src: result.src,
    name: filename,
    format,
    uploader,
    size: result.size,
  });
  return doc.toObject() as AttachmentData;
}

/**
 * 按附件 ID 批量读取文件
 * @param ids 附件 ID 数组
 * @param format 输出格式：'src'(默认) / 'buffer' / 'base64'
 */
export async function getFile(
  ids: string[],
  format: 'src' | 'buffer' | 'base64' = 'src'
): Promise<(Buffer | string)[]> {
  if (ids.length === 0) return [];
  await dbConnect();
  // 查询数据库
  const docs = await Attachment.find({ _id: { $in: ids } });
  const map = new Map(docs.map(d => [String(d._id), d]));
  for (const id of ids) if (!map.has(id)) throw new Error(`附件 ${id} 不存在`);
  if (format === 'src') return ids.map(id => map.get(id)!.src);
  // 需要读取文件内容，单次获取适配器实例
  const adapter = await getAdapter();
  return Promise.all(ids.map(async id => {
    const doc = map.get(id)!;
    // base64 类型直接解码，其他走远程存储
    const data = doc.type === 'base64'
      ? Buffer.from(doc.src, 'base64')
      : await adapter.load(doc.src);
    return format === 'base64' ? data.toString('base64') : data;
  }));
}

/** 删除附件记录及远程文件 */
export async function delFile(attachmentId: string): Promise<void> {
  await dbConnect();
  const doc = await Attachment.findById(attachmentId);
  if (!doc) throw new Error(`附件 ${attachmentId} 不存在`);
  const adapter = await getAdapter();
  // 先删远程文件，再删数据库记录
  await adapter.remove(doc.src);
  await Attachment.findByIdAndDelete(attachmentId);
}

// 重新导出类型和类
export type { StorageAdapter, StorageType, AttachmentData, StorageConfig };
export { Base64Adapter, VercelBlobAdapter, R2Adapter, WebdavAdapter };
