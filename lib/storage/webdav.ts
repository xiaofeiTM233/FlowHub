// lib/storage/webdav.ts
import { createClient, type WebDAVClient } from 'webdav';
import type { StorageAdapter, SaveResult, StorageConfig } from './types';

/**
 * WebDAV 适配器
 *
 * 连接到任意 WebDAV 服务（坚果云、阿里云盘、NextCloud 等），
 * 文件读写均通过服务端代理，不需要公开 URL。
 *
 * 凭证通过构造参数传入，由前端在设置页面配置后存入 Options。
 */
export class WebdavAdapter implements StorageAdapter {
  readonly type = 'webdav' as const;

  private client: WebDAVClient;
  private basePath: string;

  constructor(config: StorageConfig) {
    const url = config.webdavUrl;
    const user = config.webdavUser;
    const pass = config.webdavPass;

    if (!url || !user || !pass) {
      throw new Error('WebDAV 凭证未完整配置，请在系统设置中填写所有必填项');
    }

    this.basePath = (config.webdavBasePath || '/flowhub/').replace(/\/?$/, '/');

    this.client = createClient(url, {
      username: user,
      password: pass
    });
  }

  async save(filename: string, buffer: Buffer): Promise<SaveResult> {
    const key = `${Date.now()}-${filename}`;
    const path = `${this.basePath}${key}`;

    await this.client.createDirectory(this.basePath).catch(() => {
      // 目录可能已存在，忽略错误
    });

    await this.client.putFileContents(path, buffer, { overwrite: true });

    return { src: key, size: buffer.length };
  }

  async load(src: string): Promise<Buffer> {
    const path = src.startsWith('/') || src.startsWith(this.basePath)
      ? src
      : `${this.basePath}${src}`;

    const content = await this.client.getFileContents(path);
    if (typeof content === 'string') {
      return Buffer.from(content);
    }
    return Buffer.from(content as ArrayBuffer);
  }

  async remove(src: string): Promise<void> {
    const path = src.startsWith('/') || src.startsWith(this.basePath)
      ? src
      : `${this.basePath}${src}`;

    await this.client.deleteFile(path);
  }
}
