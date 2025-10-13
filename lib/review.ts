// lib/review.ts
import axios from 'axios';

/**
 * 向指定群组推送审核消息
 * @param {any} account - 账号对象
 * @param {any} messages - 消息对象
 * @param {any} option - 配置对象
 * @returns {Promise<any>} 推送操作的结果
 */
export async function pushNotice(account: any, messages: any, option: any): Promise<any> {
  const response = await axios.post(
    `${account.auth.url}/send_group_msg?access_token=${account.auth.token}`,
    {
      group_id: option.review_push_group,
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
 * @param {Object} draft - 投稿数据对象
 * @param {string} image - 投稿图片的base64编码字符串
 * @param {any} option - 配置对象
 * @returns {Promise<Object>} 返回消息对象
 */
export async function GenerateMSG(draft: any, image: any, option: any): Promise<any> {
  let messages = {} as any;
  const PTID = draft.timestamp;
  const nick = draft.sender.nick;
  const nickname = draft.sender.nickname;
  const user_id = draft.sender.userid;
  const from = `\n来自 ${nick ? '匿名用户 ' : `${nickname}（${user_id}）`}的投稿\n`;
  if (option.review_push_direct) {
    // 推送图文消息，默认使用
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
  } else {
    // 推送合并转发，测试性功能，不稳定，不建议使用
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
    for (const content of draft.content.list) {
      if (content.type === "json" || content.type === "file" || (content.type !== "text" && content.type !== "image" && content.type !== "face")) {
        content.type = "text";
        delete content.data;
        content.data = {
          text: `不支持的文件类型`
        }
      }
      messages.data.push({
        type: "node",
        data: {
          user_id,
          nickname,
          content
        }
      })
    }
  }
  return messages;
}

/**
 * 推送审核通知
 * @param {any} account - 账号对象
 * @param {any} draft - 投稿数据对象
 * @param {any} image - 投稿图片的base64编码字符串
 * @param {any} option - 配置对象
 * @returns {Promise<any>} 推送操作的结果
 */
export async function pushReview(account: any, draft: any, image: any, option: any): Promise<any> {
  const messages = await GenerateMSG(draft, image, option);
  const result = await pushNotice(account, messages, option);
  return result;
}

/**
 * 调用AI标签审核接口对内容进行审核
 * @param {any} data - 需要审核的内容
 * @returns {Promise<any>} 返回AI标签审核的结果
 */
export async function getTags(data: any): Promise<any> {
// 调用AI标签审核接口
  const tres = await axios.post(process.env.REVIEW_TAG_URL as string, {
    data
  },
  {
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' }
  });
  return tres.data;
}
