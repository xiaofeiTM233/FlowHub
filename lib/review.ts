// lib/review.ts
import axios from 'axios';

/**
 * 向指定群组推送审核消息
 * @param {any} account - 账号对象
 * @param {any} messages - 消息对象
 * @returns {Promise<any>} 推送操作的结果
 */
export async function pushNotice(account: any, messages: any): Promise<any> {
  const response = await axios.post(
    `${account.auth.url}/send_group_msg?access_token=${account.auth.token}`,
    {
      group_id: process.env.REVIEW_PUSH_GROUP,
      message: messages.data,
      ...(messages.news ? { news: messages.news } : {}),
      ...(messages.prompt ? { prompt: messages.prompt } : {}),
      ...(messages.summary ? { summary: messages.summary } : {}),
      ...(messages.source ? { source: messages.source } : {})
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

/**
 * 生成推送消息结构
 * @param {Object} print - 投稿数据对象
 * @param {string} image - 投稿图片的base64编码字符串
 * @returns {Promise<Object>} 返回消息对象
 */
export async function GenerateMSG(print: any, image: any): Promise<any> {
  let messages = {} as any;
  const PTID = print.timestamp;
  const nick = print.sender.nick;
  const nickname = print.sender.nickname;
  const user_id = print.sender.userid;
  const from = `\n来自 ${nick ? '匿名用户 ' : `${nickname}（${user_id}）`}的投稿\n`;
  if (process.env.REVIEW_PUTH_TYPE === '2') {
    messages = {
      data: [
        {
          type: "node",
          data: {
            user_id: "800864530",
            nickname: "系统消息",
            content: [
              {
                type: "text",
                data: {
                  text: `*PTID：${PTID}`
                }
              },
              {
                type: "text",
                data: {
                  text: from
                }
              },
              {
                type: "image",
                data: {
                  file: `base64://${image}`
                }
              }
            ]
          }
        },
        {
          type: "node",
          data: {
            user_id: "800864530",
            nickname: "系统消息",
            content: [
              {
                type: "text",
                data: {
                  text: "以下是原始投稿："
                }
              }
            ]
          }
        }
      ],
      news: [
        {
          text: `*新投稿待审核：${PTID}`
        },
        {
          text: `*${from}`
        }
      ],
      prompt: `[新投稿待审核]：${PTID}`,
      summary: "Powered by FlowHub",
      source: "!待审核投稿"
    };
    for (const content of print.content.list) {
      messages.data.push({
        type: "node",
        data: {
          user_id,
          nickname,
          content
        }
      })
    }
  } else {
    messages = {
      data: [
        {
          type:"text",
          data: {
            text: `*新投稿待审核：${PTID}${from}`
          }
        },
        {
          type: "image",
          data: {
            file: `base64://${image}`
          }
        }
      ]
    };
  }
  return messages;
}

/**
 * 推送审核通知
 * @param {any} account - 账号对象
 * @param {any} print - 投稿数据对象
 * @param {any} image - 投稿图片的base64编码字符串
 * @returns {Promise<any>} 推送操作的结果
 */
export async function pushReview(account: any, print: any, image: any): Promise<any> {
  const messages = await GenerateMSG(print, image);
  const result = await pushNotice(account, messages);
  return result;
}
