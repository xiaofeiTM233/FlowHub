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
  let tdata = {
    "model": process.env.REVIEW_TAG_MODEL || "glm-4.6v-flash",
    "messages": [
      {
        "role": "system",
        "content": "你是内容安全审查专家。"
      },
      {
        "role": "user",
        "content": "你是内容安全审查专家。请给校园墙投稿内容打标签。\n\n请根据以下标准判断内容是否安全：\n\n## 校园墙稿件审核标签体系（只允许从这里选择标签）\n**体系定位**：按「风险等级+功能」分类的标签系统，包含标签名称与具体描述，用于精准标记内容属性、指导审核决策。\n\n### 通用（所有稿件必选，描述内容形式/身份特征，用于快速筛选分类）\n- **匿名**：作者主动隐藏投稿身份（如匿名、打码、码死及谐音/emoji变体🐎等）\n- **非匿名**：作者明确使用投稿账号身份（如“不匿”等表述）  \n- **纯文字**：内容仅为文字，无图片/视频/链接等附件\n- **含图片**：附带至少1张图片/截图（如聊天记录、证件照等，需额外审核图片违规性）\n- **含不支持类型消息**：含标准输入（text、image、face）以外的附件类型  \n- **需人工处理**：内容涉及多投稿或AI无法判断的模糊场景  \n\n### 高风险（违法违规/人身伤害/严重侵权/破坏秩序）  \n- **涉政敏感**：不当讨论国家政策/领导人形象/时政事件（如调侃政策、传不实政治谣言），或使用敏感符号/言论  \n- **暴力描述**：具体描写打架斗殴、伤害他人身体（如“XX被打出血”）、自残（割腕/自杀未遂细节）或血腥画面  \n- **人身攻击**：针对个人/群体的辱骂、歧视言论（如地域黑“某省人都XX”、性别攻击“女生不如男生”）\n- **隐私泄露**：未经允许公开他人敏感信息（身份证号/手机号/住址/行程轨迹/带个人信息的聊天截图等）  \n- **造谣诽谤**：无证据指控他人（如“XX偷钱包”“XX考试作弊”），可能损害名誉（需作者提供实证否则违规）\n- **煽动对立**：刻意挑拨学生与学校/老师/同学的关系（如“所有教授都压榨学生”），可能引发群体冲突  \n- **违法引导**：传授违法方法（作弊/伪造证件）、推广违禁品（管制刀具/假烟假酒）或诱导不良行为（网贷/赌博）\n\n### 中风险（可能引发争议/不适/轻微违规）\n- **负面过载**：大段宣泄极端负面情绪（如“活着没意思”“想退学”），无正向引导，可能引发模仿或心理不适\n- **争议话题**：易引发群体对立的内容（如“支持/反对强制早八”“评教该不该打低分”），需判断是否超正常讨论范围\n- **挂人预警**：未明确证据的指责（如“XX总逃课还打小报告”），可能升级为网络暴力或私下矛盾\n- **过度吐槽**：具体批评教学/管理问题（如“XX老师只会念PPT”“后勤修水管拖一周”），无建设性反馈，可能激化对立\n- **广告嫌疑**：广告以及未标“广告”的暗广（如“推荐XX考研机构”“代取快递1元一次”），需判断是否隐蔽营销\n- **暧昧暗示**：未明确表白的亲密关系描述（如“最近和某人走得近”“TA是不是喜欢我？”），可能引发误会或隐私争议\n\n### 低风险（常规校园互动，符合社区氛围）\n- **询问**：具体问题咨询（课程难度/选课建议/快递点/失物招领/活动安排/校园卡办理等），寻求客观信息\n- **祝福**：生日/考试/比赛/节日的正向情感表达（如“祝室友生日快乐”“高考加油”；需注意反语/暗语攻击）\n- **找搭子**：轻社交需求（拼课/拼饭/图书馆自习/看电影/健身搭子等），不涉及金钱或敏感信息\n- **正能量**：分享积极经历（获奖/志愿活动/学习干货/校园美景打卡等），传递正向价值\n- **树洞倾诉**：非负面过载的个人心情记录（如“今天看到晚霞很开心”“完成小目标”），无攻击性或过度情绪\n- **活动宣传**：社团活动/比赛组队/读书会/运动局等非商业集体邀请（如“英语角招新，每周六下午”）\n- **科普干货**：实用信息分享（学习技巧/考试攻略/校园生活小贴士/兼职防骗等），无商业推广意图\n\n### 请在思考过后直接使用 output_tags 函数输出结果，无需回复。"
      },
      {
        "role": "user",
        "content": [
          {
            "type": "image_url",
            "image_url": {
              "url": data
            }
          }
        ]
      }
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "output_tags",
          "description": "按分类批量输出标签，校园墙稿件审核标签体系，按风险等级和功能分类，含标签名称及具体描述，用于精准标记内容属性、指导审核决策",
          "parameters": {
            "type": "object",
            "properties": {
              "通用":{"type":"array","items":{"type":"string"},"description":"所有稿件必选的基础属性标签，描述内容的形式/身份特征，用于快速筛选和分类"},
              "高风险":{"type":"array","items":{"type":"string"},"description":"涉及违法违规、人身伤害、严重侵权或破坏校园秩序的内容"},
              "中风险":{"type":"array","items":{"type":"string"},"description":"可能引发争议、不适或轻微违规的内容"},
              "低风险":{"type":"array","items":{"type":"string"},"description":"常规校园互动内容，符合社区氛围"}
            },
            "required": [
              "通用"
            ]
          }
        }
      }
    ],
    "tool_choice": "auto",
    "thinking": {
      "type": "enabled"
    }
  };
  // 调用AI标签审核接口
  const tres = await axios.post(process.env.REVIEW_TAG_URL as string, tdata, {
    timeout: 60000,
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.REVIEW_TAG_KEY && { 'Authorization': `Bearer ${process.env.REVIEW_TAG_KEY}` })
    }
  });
  return JSON.parse(tres.data.choices[0].message.tool_calls[0].function.arguments);
}
