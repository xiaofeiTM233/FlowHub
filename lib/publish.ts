// lib/publish.ts
import Account from '@/models/accounts';
import { biliPlus } from '@/lib/adapter/bili';
import { qzonePlus } from '@/lib/adapter/qzone';
import { resolveImages } from '@/lib/storage';

/**
 * 将帖子发布到所有指定的平台
 * @param post 要发布的帖子对象
 * @returns 各平台发布结果
 */
export async function publish(post: any) {
  let results = post.results || {};
  const content = { ...post.content };

  // 已发布则直接返回结果
  if (post.type === 'published') {
    return results;
  }

  // 附件 ID → base64（适配器仍使用 base64 上传）
  if (content.images && content.images.length > 0) {
    content.images = await resolveImages(content.images);
  }

  // 遍历平台发布
  for (const aid of post.sender.platform) {
    // 已发布则跳过
    if (results[aid]?.status === 'success') continue;
    const account = await Account.findOne({ aid });

    if (account.platform === 'bili') {
      // bili
      results[aid] = await biliPlus(account, content);
    } else if (account.platform === 'qzone') {
      // qzone
      results[aid] = await qzonePlus(account, content);
    } else {
      results[aid] = { platform: account.platform, status: 'error', message: '不支持的平台' };
    }
  }
  
  return results;
}
