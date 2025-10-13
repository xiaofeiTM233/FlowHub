// app/review/page.tsx
import { Post, PostsApiResponse, PostType } from '@/lib/types';
import PostTable from '@/components/PostTable';
import PostFilters from '@/components/PostFilters';

// --- 模拟数据 ---
const mockPosts: Post[] = [
  { _id: "post_001", type: "pending", timestamp: Date.parse("2023-11-15T10:00:00Z"), sender: { platform: ["wechat"], userid: 10001, nickname: "摄影新手", nick: true }, content: { text: "第一次拍日落，请多指教！", images: ["https://picsum.photos/seed/sunset1/800/600"] }, review: { approve: [], reject: [], comments: [], stat: { approve: 0, reject: 0 } } },
  { _id: "post_002", type: "pending", timestamp: Date.parse("2023-11-15T11:30:00Z"), sender: { platform: ["qq"], userid: 10002, nickname: "抽象派画师", nick: true }, content: { text: "这幅画表达了内心的挣扎。", images: ["https://picsum.photos/seed/abstract2/800/600"] }, review: { approve: [{ mid: 'admin_A', reason: '有创意' }], reject: [{ mid: 'admin_B', reason: '看不懂' }], comments: [], stat: { approve: 1, reject: 1 } } },
  { _id: "post_003", type: "approved", timestamp: Date.parse("2023-11-14T09:00:00Z"), sender: { platform: ["weibo"], userid: 10003, nickname: "萌宠博主", nick: true }, content: { text: "我家猫咪的睡颜~", images: ["https://picsum.photos/seed/cat3/800/600"] }, review: { approve: [{ mid: 'admin_A', reason: '可爱' }, { mid: 'admin_C', reason: '治愈' }], reject: [], comments: [], stat: { approve: 2, reject: 0 } } },
  { _id: "post_004", type: "rejected", timestamp: Date.parse("2023-11-14T14:00:00Z"), sender: { platform: ["qq"], userid: 10004, nickname: "美食家", nick: true }, content: { text: "深夜放毒！", images: ["https://picsum.photos/seed/food4/800/600"] }, review: { approve: [{ mid: 'admin_A', reason: '看起来不错' }], reject: [{ mid: 'admin_B', reason: '图片模糊' }, { mid: 'admin_C', reason: '广告嫌疑' }], comments: [], stat: { approve: 1, reject: 2 } } },
  ...Array.from({ length: 20 }, (_, i) => ({ _id: `post_${100 + i}`, type: "pending" as PostType, timestamp: Date.now() - i * 3600000, sender: { platform: ["qq"], userid: 20000 + i, nickname: `路人甲_${i}`, nick: true }, content: { text: `随手拍 ${i + 1}`, images: [`https://picsum.photos/seed/random${i}/800/600`] }, review: { approve: [], reject: [], comments: [], stat: { approve: 0, reject: 0 } } }))
];

// --- 数据获取函数 ---
async function fetchPosts(type: string, page: number, limit: number): Promise<PostsApiResponse> {
  // --- 模拟逻辑 ---
  let filtered: Post[];
  if (type === 'all') {
    filtered = mockPosts;
  } else {
    filtered = mockPosts.filter(post => post.type === type);
  }
  const sorted = filtered.sort((a, b) => b.timestamp - a.timestamp);
  const total = sorted.length;
  const start = (page - 1) * limit;
  const posts = sorted.slice(start, start + limit);
  await new Promise(res => setTimeout(res, 300));
  return { posts, totalPosts: total, currentPage: page, totalPages: Math.ceil(total / limit), limit };
}

export default async function AdminPostsPage({ searchParams }: {
  searchParams: { type?: string; page?: string; limit?: string; };
}) {
  const type = (searchParams.type || 'pending') as PostType;
  const page = parseInt(searchParams.page || '1', 10);
  const limit = parseInt(searchParams.limit || '15', 10);

  const { posts, totalPages } = await fetchPosts(type, page, limit);

  return (
    <div>
      <PostFilters page={page} totalPages={totalPages} />
      {posts.length === 0
        ? <div className="text-center py-10 bg-white rounded-lg shadow-md"><p className="text-gray-500">没有找到符合条件的帖子。</p></div>
        : <PostTable posts={posts} />
      }
    </div>
  );
}