import axios from 'axios';
import FormData from 'form-data';

// 定义 Bilibili 上传接口完整响应类型
export interface biliUploadApi {
    img_src: string;
    img_width: number;
    img_height: number;
    img_size: number;
}
// 定义 Bilibili 发布动态接口 data 字段类型
export interface biliPublishApi {
  dyn_id: number;
  dyn_id_str: string;
  dyn_type: number;
  dyn_rid: number;
}

/**
 * biliUpload ｜ 上传B站图床
 * @param account 账号对象
 * @param base64 图片的 base64 字符串
 * @returns Bilibili 接口返回的 data 字段
 */
export async function biliUpload(account: any, base64: string): Promise<biliUploadApi> {
  // 获取 Cookies
  const csrf = account.cookies.bili_jct;
  const cookies = Object.entries(account.cookies).map(([key, value]) => `${key}=${value}`).join('; ');

  // 构造图片二进制数据
  const image = Buffer.from(base64, 'base64');
  // 构造表单数据
  const formData = new FormData();
  formData.append('file_up', image, { filename: 'image.png', contentType: 'image/png' });
  formData.append('biz', 'new_dyn');
  formData.append('category', 'daily');
  formData.append('csrf', csrf);

  // 构造请求头
  const headers = {
    ...formData.getHeaders(),
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Cookie': cookies,
    'Origin': 'https://t.bilibili.com',
    'Referer': 'https://t.bilibili.com/',
  };
  // 发送 POST 请求到 Bilibili 图片上传接口
  const response = await axios.post(
    'https://api.bilibili.com/x/dynamic/feed/draw/upload_bfs',
    formData,
    { headers }
  );
  //console.log('biliUpload result:', response.data);
  // 返回接口 data 字段
  let result: biliUploadApi = {
    img_src: response.data.data.image_url,
    img_width: response.data.data.image_width,
    img_height: response.data.data.image_height,
    img_size: response.data.data.img_size
  };
  return result;
}

/**
 * biliPublish ｜ 发布B站动态
 * @param account 账号对象
 * @param contents 动态内容对象
 * @param images 图片数组
 * @returns Bilibili 接口返回的 data 字段
 */
export async function biliPublish(account: any, contents: any, images: any): Promise<biliPublishApi> {
  // 获取 Cookies
  const csrf = account.cookies.bili_jct;
  const cookies = Object.entries(account.cookies).map(([key, value]) => `${key}=${value}`).join('; ');

  // 构造动态内容对象
  const content = { dyn_req: { content: { contents: [] }, pics: [], scene: 2/*, "attach_card": null, "upload_id": "646195980_1745233460_9967"*/, meta: { app_meta: { from: 'create.dynamic.web', mobi_app: 'web' } } } };
  content.dyn_req.content.contents = contents;
  content.dyn_req.pics = images;
  console.log('biliPublish content:', JSON.stringify(content));

  // 发送 POST 请求到 B站动态发布接口
  const response = await axios({
    method: 'post',
    url: `https://api.bilibili.com/x/dynamic/feed/create/dyn?csrf=${csrf}`,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Cookie': cookies
    },
    data: content
  });
  //console.log('biliPublish result:', response.data);
  // 返回接口 data 字段
  let result = response.data.data;
  return result as biliPublishApi;
}

/**
 * biliDelete ｜ 删除B站动态
 * @param account 账号对象
 * @param dyn_id_str 动态ID字符串
 * @returns Bilibili 接口返回的 data 字段
 */
export async function biliDelete(account: any, dyn_id_str: string): Promise<any> {
  const csrf = account.cookies.bili_jct;
  const cookies = Object.entries(account.cookies).map(([key, value]) => `${key}=${value}`).join('; ');
  const data = { dyn_id_str, csrf };
  const response = await axios.post(
    'https://api.bilibili.com/x/dynamic/feed/delete',
    data,
    {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Cookie': cookies
      }
    }
  );
  return response.data;
}

/**
 * biliStat ｜ 获取B站创作中心数据
 * @param account 账号对象
 * @returns 返回统计数据
 */
export async function biliStat(account: any): Promise<any> {
  try {
    const cookies = Object.entries(account.cookies).map(([key, value]) => `${key}=${value}`).join('; ');
    const [videoStat, articleStat] = await Promise.all([
      axios.get('https://member.bilibili.com/x/web/data/index/stat', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Cookie': cookies
        }
      }),
      axios.get('https://member.bilibili.com/x/web/data/article', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Cookie': cookies
        }
      })
    ]);
    let result = {
      video: videoStat.data.data,
      article: articleStat.data.data
    };
    delete result.video.fan_recent_thirty;
    return result;
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * biliPlus ｜ 封装：上传+发布
 * @param account 账号对象
 * @param content 帖子内容
 * @returns 发布结果
 */
export async function biliPlus(account: any, content: any) {
  try {
    const pics = [];
    if (content.images && content.images.length > 0) {
      for (const image of content.images) {
        pics.push(await biliUpload(account, image));
      }
    }
    const contents = [
      {
        raw_text: content.text,
        type: 1,
        biz_id: ''
      }
    ];
    const data = await biliPublish(account, contents, pics);
    return { platform: 'bili', status: 'success', data };
  } catch (error: any) {
    return { platform: 'bili', status: 'error', message: error.message };
  }
}