// lib/renderer.ts
import puppeteer, { Browser, ScreenshotOptions } from 'puppeteer-core';
import mustache from 'mustache';
import QRCode, { QRCodeToDataURLOptions } from 'qrcode';

type OutputType = 'base64' | 'buffer' | 'base64Array' | 'html';

/**
 * buildHtml | 根据 messages 列表生成渲染到模板的 HTML 片段（chtml）。
 */
async function buildHtml(list: any[]): Promise<string> {
  // 生成 qrCode 的设置
  const qrCodeOptions: QRCodeToDataURLOptions = {
    errorCorrectionLevel: 'M',
    type: 'image/webp'
  };
  // 生成渲染模板
  let chtml = '';
  let i = 0;
  const CACHER_URL = process.env.CACHER_URL || '';
  for (const msgs of list) {
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
        if (match) [card.type, card.title] = [match[1], match[2].trim()];
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
  return chtml;
}

/**
 * render | 使用 Puppeteer 连接到 Chrome 实例，渲染 HTML 模板并截图。
 *
 * @param {string} template - 包含 Mustache 标签的 HTML 模板字符串。
 * @param {Record<string, any>} data - 用于填充模板的 content 对象。
 * @param {OutputType} [outputType='base64'] - 'base64' / 'buffer' / 'base64Array' / 'html'。
 * @returns {Promise<any>} 截图的 Base64 字符串或 Buffer。
 */
export async function render(
  template: string,
  data: Record<string, any>,
  outputType: OutputType = 'buffer'
): Promise<any> {
  let browser: Browser | null = null;
  try {
    const chtml = await buildHtml(data.list);
    delete data.list;
    data.chtml = chtml;
    const html = mustache.render(template, data);
    if (outputType === 'html') {
      return html;
    }
    // 连接到 Chrome 实例
    browser = await getBrowser();
    if (!browser) {
      throw new Error('连接 Chrome 实例失败');
    }
    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080
    });
    await page.setContent(html, {
      timeout: 1000000,
      waitUntil: 'load'
    });
    const options: ScreenshotOptions = {
      type: 'png',
      omitBackground: false,
      //quality: 100,
    };
    if (outputType === 'base64') {
      options.encoding = 'base64';
    }
    // 分片截图：仅在 base64Array 模式下使用，需配合前端分片 JS
    if (outputType === 'base64Array') {
      options.encoding = 'base64';
      const elements = await page.$$('.container');
      const results: string[] = [];
      // 遍历元素，分别截图
      for (const element of elements) {
        const result = await element.screenshot(options);
        results.push(typeof result === 'string' ? result : Buffer.from(result).toString('base64'));
      }
      return results;
    }
    // 截图并返回结果
    const body = await page.$('#container');
    if (!body) {
      throw new Error('未找到 #container 元素');
    }
    const result = await body.screenshot(options);
    page.close().catch((err) => console.error(err))
    if (typeof result === 'string') {
      return result;
    }
    return Buffer.from(result);
  } catch (error) {
    console.error('[Render][renderer] Puppeteer 渲染出错:', error);
    throw new Error('渲染 HTML 时出错');
  } finally {
    if (browser && process.env.RENDER_TYPE === '1') {
      await browser.disconnect();
    } else if (browser && process.env.RENDER_TYPE === '0') {
      // Sparticuz 二进制是 launch 出来的，需要彻底关闭而非 disconnect
      try {
        // Sparticuz 文档建议多次 close 以彻底清理
        await Promise.race([
          browser.close(),
          browser.close(),
          browser.close(),
        ]);
      } catch (e) {
        console.error('[Render][renderLocal] 关闭浏览器失败:', e);
      }
    }
  }
}

async function getBrowser() {
  if (process.env.RENDER_TYPE === '1') {
    // 连接到远程 Chrome 实例
    const browserWSEndpoint = process.env.REMOTE_CHROME_URL;
    if (!browserWSEndpoint) {
      throw new Error('未设置 REMOTE_CHROME_URL 环境变量');
    }
    return await puppeteer.connect({ browserWSEndpoint });
  } else if (process.env.RENDER_TYPE === '0') {
    // 本地 Sparticuz/chromium-min
    if (process.platform !== 'linux') {
      throw new Error(
        `RENDER_TYPE=0 (Sparticuz/chromium) 仅支持 Linux 平台，当前平台为 ${process.platform}。`
      );
    }
    // 动态加载：避免在 Windows / macOS 上 import 时抛出
    const chromium = (await import('@sparticuz/chromium-min')).default;
    const packUrl = process.env.CHROMIUM_PACK_URL
      || 'https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar';
    return await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      executablePath: await chromium.executablePath(packUrl),
      headless: true,
      defaultViewport: { width: 1920, height: 1080 },
    });
  } else {
    throw new Error('不支持的 RENDER_TYPE');
  }
}
