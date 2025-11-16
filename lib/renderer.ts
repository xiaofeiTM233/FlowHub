// lib/renderer.ts
import puppeteer, { Browser, ScreenshotOptions } from 'puppeteer-core';
import mustache from 'mustache';
import QRCode, { QRCodeToDataURLOptions } from 'qrcode';

type OutputType = 'base64' | 'buffer' | 'base64Array' | 'html';

/**
 * render | 使用 Puppeteer 连接到远程 Chrome 实例，渲染 HTML 模板并截图。
 *
 * @param {string} template - 包含 Mustache 标签的 HTML 模板字符串。
 * @param {Record<string, any>} data - 用于填充模板的 content 对象。
 * @param {OutputType} [outputType='base64'] - 'base64' 或 'buffer'。
 * @returns {Promise<any>} 截图的 Base64 字符串或 Buffer。
 */
export async function render(
  template: string,
  data: Record<string, any>,
  outputType: OutputType = 'buffer'
): Promise<any> {
  let browser: Browser | null = null;
  try {
    // 生成 qrCode 的设置
    const qrCodeOptions: QRCodeToDataURLOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/webp'
    };
    // 生成渲染模板
    let chtml = '';
    let i = 0;
    const CACHER_URL = process.env.CACHER_URL || '';
    for (const msgs of data.list) {
      i++;
      //html += `<div class="list-${i}">${JSON.stringify(msgs)}</div>`;
      if (msgs.length === 1 && msgs[0].type === 'image') {
        chtml += `<img class="list-${i}" src="${CACHER_URL}${msgs[0].data.url}" data-type="image"/>`;
      } else if (msgs.length === 1 && msgs[0].type === 'json') {
        // 处理卡片消息
        //html += `<div class="list-${i}" data-type="json">${JSON.stringify(msgs[0].data)}</div>`;
        const data = JSON.parse(msgs[0].data.data)
        let card: any = {};
        const meta = data.meta;
        if (data.prompt) {
          const match = data.prompt.match(/\[(.*?)\](.*)/);
          if (match)[card.type, card.title] = [match[1], match[2].trim()];
        }
        if (meta?.miniapp) {
          card.icon = meta.miniapp.sourcelogo || meta.miniapp.tagIcon || '';
          card.title = meta.miniapp.title || card.title;
          card.description = data.desc || meta.miniapp.source || '';
          card.link = meta.miniapp.jumpUrl || meta.miniapp.pcJumpUrl || '';
        } else if (meta?.detail_1) {
          card.icon = meta.detail_1.icon || '';
          card.title = meta.detail_1.desc || card.title;
          card.description = meta.detail_1.title || '';
          card.link = meta.detail_1.qqdocurl || meta.detail_1.url || '';
        } else if (meta?.news) {
          card.icon = meta.news.tagIcon || meta.news.preview || '';
          card.title = meta.news.title || card.title;
          card.description = meta.news.desc || '';
          card.link = meta.news.jumpUrl || '';
          if (meta.news.tag) card.type = `${meta.news.tag}分享`;
        } else if (meta?.contact) {
          card.icon = meta.contact.avatar || '';
          card.title = meta.contact.nickname || card.title;
          card.description = meta.contact.contact || '';
          card.link = meta.contact.jumpUrl || '';
          card.type = meta.contact.tag;
        }
        if (card.type === '推荐好友') card.link = 'https://mp.qzone.qq.com/u/' + card.description.match(/：(.*)/)[1];
        if (card.link && !/^(http|miniapp|mqqapi)/.test(card.link)) card.link = 'https://' + card.link;
        if (card.link && /^(mqqapi)/.test(card.link)) card.link = 'nolink://';
        // 添加消息
        chtml += `<a class="list-${i} link-card" href="${card.link || 'nolink://'}" target="_blank" rel="noopener noreferrer" data-type="json">`;
        chtml += `<div class="card-content">`;
        chtml += `<img src="${card.icon}" alt="图标" class="card-img" data-type="icon" onerror="this.style.display='none'">`;
        chtml += `<div class="card-text"><p class="card-title">${card.title}</p><p class="card-description">${card.description}</p></div>`;
        if (card.link && card.link !== 'nolink://') {
          let url = new URL(card.link);
          if (url.hostname === 'b23.tv') {
            url.search = '';
          }
          const link = url.toString();
          const qr = await QRCode.toDataURL(link, qrCodeOptions);
          chtml += `<img class="card-img" data-type="qr" src="${qr}" onerror="this.style.display='none'"/>`;
        }
        chtml += `</div>`;
        chtml += `<div class="card-footer"><span>${card.type}</span></div>`;
        chtml += `</a>`;
      } else {
        // 处理普通消息
        let contents = '';
        for (const msg of msgs) {
          switch (msg.type) {
            case 'text':
              contents += `<span data-type="${msg.type}">${msg.data.text}</span>`;
              break;
            case 'image':
              contents += `<img src="${CACHER_URL}${msg.data.url}" data-type="${msg.type}"/>`;
              break;
            case 'face':
              contents += `<img src="https://hitfun.top/face/${msg.data.id}.png" class="cqface" onerror="this.src='https://hitfun.top/face/284.png';" data-type="${msg.type}"/>`;
              break;
            case 'file':
              contents += `<span class="unsupported" data-type="${msg.type}">[文件]${msg.data.file}</span>`;
              break;
            default:
              contents += `<span class="unsupported" data-type="${msg.type}">不支持的类型：${msg.type}</span>`;
          }
        }
        chtml += `<div class="list-${i}" data-type="normal">${contents}</div>`;
      }
    }
    delete data.list;
    data.chtml = chtml;
    const html = mustache.render(template, data);
    if (outputType === 'html') {
      return html;
    }
    // 连接到远程 Chrome 实例
    const browserWSEndpoint = process.env.REMOTE_CHROME_URL;
    if (!browserWSEndpoint) {
      throw new Error('未设置 REMOTE_CHROME_URL 环境变量');
    }
    browser = await puppeteer.connect({ browserWSEndpoint });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080
    });
    await page.setContent(html, {
      timeout: 1000000,
      waitUntil: 'networkidle0'
    });
    const options: ScreenshotOptions = {
      type: 'png',
      omitBackground: false,
      //quality: 100,
    };
    if (outputType === 'base64') {
      options.encoding = 'base64';
    }

    // 万一有人喜欢分片截图呢，先做个功能，不使用，仅支持base64模式，且还需有分片js支持
    if (outputType === 'base64Array') {
      options.encoding = 'base64';
      // 可以通过 page.$$() 获取所有匹配选择器的元素，类似 document.querySelectorAll() 这会返回一个包含所有元素句柄的数组
      const elements = await page.$$('.container');
      let results = [];

      // 遍历元素，分别截图
      for (const element of elements) {
        const result = await element.screenshot(options);
        results.push(result);
      }
      return results;
    }

    // 截图并返回结果
    const body = await page.$('#container');
    if (!body) {
      throw new Error('未找到 #container 元素');
    }
    let result = await body.screenshot(options);
    page.close().catch((err) => console.error(err))
    if (typeof result === 'string') {
      return result;
    }
    return Buffer.from(result);

  } catch (error) {
    console.error('[Render][renderer] Puppeteer 渲染出错:', error);
    throw new Error('渲染 HTML 时出错');
  } finally {
    if (browser) {
      await browser.disconnect();
    }
  }
}