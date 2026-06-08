// lib/storage/types.ts

/** 支持的存储类型 */
export type StorageType = 'vercel' | 'r2' | 'base64' | 'webdav';

/** 从 Options 文档中传入的存储配置 */
export interface StorageConfig {
  /** 当前激活的存储类型 */
  type: StorageType;

  // --- Vercel Blob ---
  vercelToken?: string;

  // --- Cloudflare R2 ---
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2Endpoint?: string;
  r2Bucket?: string;
  r2PublicUrl?: string;

  // --- WebDAV ---
  webdavUrl?: string;
  webdavUser?: string;
  webdavPass?: string;
  webdavBasePath?: string;
}

/** 存储适配器统一接口 */
export interface StorageAdapter {
  /** 适配器对应的存储类型标识 */
  readonly type: StorageType;

  /**
   * 保存文件
   * @param filename 文件名（含扩展名，如 post-123.png）
   * @param buffer  文件二进制数据
   * @param format  文件格式，如 'png'
   * @returns 存储后可用于取回的 src 标识
   */
  save(filename: string, buffer: Buffer, format: string): Promise<SaveResult>;

  /**
   * 加载文件
   * @param src save 返回的 src 标识
   * @returns 文件二进制数据
   */
  load(src: string): Promise<Buffer>;

  /**
   * 删除文件
   * @param src save 返回的 src 标识
   */
  remove(src: string): Promise<void>;
}

/** save 方法的返回值 */
export interface SaveResult {
  /** 存储标识：vercel/r2 为 URL，base64 为 base64 字符串，webdav 为路径 */
  src: string;
  /** 文件大小（字节） */
  size: number;
}

/** 单个附件记录的纯数据表示 */
export interface AttachmentData {
  _id: string;
  type: StorageType;
  src: string;
  name: string;
  format: string;
  uploader: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}
