import axios from 'axios';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

/**
 * qzoneStat | 获取空间访客
 * @param account 账号对象
 * @returns 今日浏览量字符串
 */
export async function qzoneStat(account: any): Promise<string> {
  try {
    // 账号基本信息
    const uid = account.uid;
    const g_tk = account.cookies.g_tk;
    const cookies = Object.entries(account.cookies).map(([key, value]) => `${key}=${value}`).join('; ');

    // 发起请求
    const url = `https://h5.qzone.qq.com/proxy/domain/g.qzone.qq.com/cgi-bin/friendshow/cgi_get_visitor_more?uin=${uid}&g_tk=${g_tk}&mask=7&page=1&fupdate=1&clear=1`;
    const response = await axios.get(url, { headers: { 'User-Agent': UA, Cookie: cookies } });

    // 处理响应数据
    const jsondata = response.data.replace('_Callback(', '').slice(0, -3);
    const result = JSON.parse(jsondata).data;
    return { code: 0, message: `今日浏览量为：${result.todaycount}`, data: result };
  } catch (err: any) {
    return { code: -1, message: '出现错误: ' + (err.message || err) };
  }
}

/**
 * qzoneBlock | 屏蔽空间用户
 * @param account 账号对象
 * @param act_uin 目标用户的QQ号
 * @param action '1'为屏蔽, '2'为取消屏蔽
 * @returns 操作结果字符串
 */
export async function qzoneBlock(account: any, act_uin: string, action: '1' | '2' = '1'): Promise<string> {
  try {
    // 账号基本信息
    const uid = account.uid;
    const g_tk = account.cookies.g_tk;
    const cookies = Object.entries(account.cookies).map(([key, value]) => `${key}=${value}`).join('; ');

    // 发起请求
    const body = new URLSearchParams({
      uin: uid,
      action,
      act_uin,
      fupdate: '1',
      qzreferrer: `https://user.qzone.qq.com/${uid}`
    });
    const response = await axios({
      method: 'post',
      url: `https://user.qzone.qq.com/proxy/domain/w.qzone.qq.com/cgi-bin/right/cgi_black_action_new?&g_tk=${g_tk}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
        Cookie: cookies
      },
      data: body
    });

    // 处理响应数据
    const match = response.data.match(/frameElement\.callback\(([^]*)\);/);
    let callback;
    if (match && match[1]) {
      callback = JSON.parse(match[1].replace(/(\w+):/g, '"$1":'));
      return { code: 0, message: `投递空间完成：${callback.message} ${callback.data.name}`, data: callback.data };
    } else {
      return { code: -1, message: '操作失败：未找到返回信息' };
    }
  } catch (err: any) {
    return { code: -1, message: '出现错误: ' + (err.message || err) };
  }
}

/**
 * qzoneUpload | 上传空间图床
 * @param account 账号对象
 * @param base64 图片的base64字符串
 * @returns 上传结果data对象
 */
export async function qzoneUpload(account: any, base64: string): Promise<any> {
  try {
    // 账号基本信息
    const uid = account.uid;
    const g_tk = account.cookies.g_tk;
    const cookies = Object.entries(account.cookies).map(([key, value]) => `${key}=${value}`).join('; ');

    // 发起请求
    const body = new URLSearchParams({
      filename: 'filename',
      uin: uid,
      p_skey: account.cookies.p_skey,
      uploadtype: '1',
      albumtype: '7',
      exttype: '0',
      refer: 'shuoshuo',
      output_type: 'json',
      charset: 'utf-8',
      output_charset: 'utf-8',
      upload_hd: '1',
      hd_width: '2048',
      hd_height: '10000',
      hd_quality: '96',
      backUrls: 'http://upbak.photo.qzone.qq.com/cgi-bin/upload/cgi_upload_image,http://119.147.64.75/cgi-bin/upload/cgi_upload_image',
      url: `https://up.qzone.qq.com/cgi-bin/upload/cgi_upload_image?g_tk=${g_tk}`,
      base64: '1',
      qzreferrer: `https://user.qzone.qq.com/${uid}`,
      picfile: base64
    });
    const response = await axios({
      method: 'post',
      url: `https://up.qzone.qq.com/cgi-bin/upload/cgi_upload_image?g_tk=${g_tk}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
        Cookie: cookies
      },
      data: body
    });

    // 处理响应数据
    const jsondata = response.data.replace('_Callback(', '').slice(0, -3);
    //console.log('qzoneUpload result:', jsondata);
    const result = JSON.parse(jsondata).data;
    return result;
  } catch (err: any) {
    return { error: err.message || err };
  }
}

/**
 * qzonePublish | 发布空间说说
 * @param account 账号对象
 * @param u 图片信息对象
 * @param con 说说内容文本
 * @param ugc_right '1'为所有人可见, '64'为仅自己可见, '128'为部分好友不可见
 * @returns 请求状态码或错误信息
 */
export async function qzonePublish(account: any, pics: any[], con: string, ugc_right: string = '128'): Promise<number | { error: any }> {
  try {
    // 账号基本信息
    const uid = account.uid;
    const g_tk = account.cookies.g_tk;
    const cookies = Object.entries(account.cookies).map(([key, value]) => `${key}=${value}`).join('; ');

    // richval多图用\t分割 不记得为什么之前type写死为3了
    const richval = pics.map(i => `${uid},${i.albumid},${i.lloc},${i.sloc},${i.type},${i.width},${i.height},,${i.width},${i.height}`).join('\t');
    // pic_bo每张图的bo用,分割
    const bo = pics.map(i => new URLSearchParams(new URL(i.pre).search).get('bo') || '');
    const pic_bo = `${bo.join(',')}  ${bo.join(',')}`;

    // 发起请求
    const body = new URLSearchParams({
      syn_tweet_verson: '1',
      paramstr: '1',
      pic_template: '', // 不设置图片模板好像更好
      richtype: '1',
      richval,
      special_url: '',
      subrichtype: '1',
      pic_bo,
      con: con || '',
      feedversion: '1',
      ver: '1',
      to_sign: '0',
      hostuin: uid,
      code_version: '1',
      format: 'json', // 才发现可以直接输出json
      qzreferrer: `https://user.qzone.qq.com/${uid}`,
      // allow_uins: '800013811', // 腾讯社区开放平台
      ugc_right
    });
    if (ugc_right === '128') {
      body.append('allow_uins', '800013811');
    }
    const response = await axios({
      method: 'post',
      url: `https://user.qzone.qq.com/proxy/domain/taotao.qzone.qq.com/cgi-bin/emotion_cgi_publish_v6?&g_tk=${g_tk}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
        Cookie: cookies
      },
      data: body
    });
    //console.log('qzonePublish result:', response.data);
    return response.data;
  } catch (err: any) {
    return { error: err.message || err };
  }
}

/**
 * qzoneDelete | 删除空间说说
 * @param account 账号对象
 * @param tid 说说tid
 * @returns 删除结果响应数据或错误信息
 */
export async function qzoneDelete(account: any, tid: string): Promise<any> {
  try {
    // 账号基本信息
    const uid = account.uid;
    const g_tk = account.cookies.g_tk;
    const cookies = Object.entries(account.cookies).map(([key, value]) => `${key}=${value}`).join('; ');

    // 发起请求
    const data = new URLSearchParams({
      hostuin: uid,
      tid,
      t1_source: '1',
      code_version: '1',
      qzreferrer: `https://user.qzone.qq.com/${uid}/infocenter`,
      format: 'json'
    });
    const response = await axios({
      method: 'post',
      url: `https://user.qzone.qq.com/proxy/domain/taotao.qzone.qq.com/cgi-bin/emotion_cgi_delete_v6?g_tk=${g_tk}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
        Cookie: cookies
      },
      data
    });
    return response.data;
  } catch (err: any) {
    return { error: err.message || err };
  }
}
/**
 * qzonePlus ｜ 封装：上传+发布
 * @param account 账号对象
 * @param content 帖子内容
 * @returns 发布结果
 */
export async function qzonePlus(account: any, content: { text: string, images: string[] }) {
  try {
    const pics = [];
        if (content.images && content.images.length > 0) {
            for (const image of content.images) {
                pics.push(await qzoneUpload(account, image));
            }
        }
    const data = await qzonePublish(account, pics, content.text);
    return { platform: 'qzone', status: 'success', data };
  } catch (error: any) {
    return { platform: 'qzone', status: 'error', message: error.message };
  }
}
