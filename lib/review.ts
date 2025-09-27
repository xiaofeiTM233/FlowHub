// lib/review.ts
import axios from 'axios';

/**
 * 向指定群组推送审核消息
 * @param {any} account - 包含认证信息的账户对象
 * @param {any} messages - 包含待发送消息数据的对象
 * @returns {Promise<any>} 返回API调用的响应数据
 */
export async function pushReview(account: any, messages: any): Promise<any> {
  const response = await axios.post(
    `${account.auth.url}/send_group_msg?access_token=${account.auth.token}`,
    {
      group_id: process.env.REVIEW_PUSH_GROUP,
      message: messages.data
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}
