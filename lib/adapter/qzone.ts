import axios from 'axios';

/**
 * qzoneVisitorCount | 获取空间访客
 * @param account 账号对象
 * @returns 今日浏览量字符串或错误信息
 */
export async function qzoneVisitorCount(account: any): Promise<string> {
	try {
		const uin = account.uin;
		const g_tk = account.g_tk;
		const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
		const cookies = Object.entries(account.cookies).map(([key, value]) => `${key}=${value}`).join('; ');
		const url = `https://h5.qzone.qq.com/proxy/domain/g.qzone.qq.com/cgi-bin/friendshow/cgi_get_visitor_more?uin=${uin}&g_tk=${g_tk}&mask=7&page=1&fupdate=1&clear=1`;
		const res = await axios.get(url, { headers: { 'User-Agent': UA, Cookie: cookies } });
		const jsondata = res.data.replace('_Callback(', '').slice(0, -3);
		const count = JSON.parse(jsondata).data.todaycount;
		return `今日浏览量为：${count}`;
	} catch (err: any) {
		return '出现错误: ' + (err.message || err);
	}
}
