// lib/renderer.ts
import puppeteer, { Browser, ScreenshotOptions } from 'puppeteer-core';
import mustache from 'mustache';

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
    // 连接到远程 Chrome 实例
    const browserWSEndpoint = process.env.REMOTE_CHROME_URL;
    if (!browserWSEndpoint) {
      throw new Error('未设置 REMOTE_CHROME_URL 环境变量');
    }
    browser = await puppeteer.connect({ browserWSEndpoint });

    // 使用 Mustache 渲染模板
    data.list = JSON.stringify({ data: data.list });
    const html = mustache.render(template, data);
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
    let result;
    if (outputType === 'html') {
      result = await body.evaluate(el => (el as any).outerHTML);
    } else {
      result = await body.screenshot(options);
    }
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