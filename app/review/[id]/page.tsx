// app/review/[id]/page.tsx
import { Post } from '@/lib/types';
import { notFound } from 'next/navigation';
import PostActions from './PostActions';
import { PostType } from '@/lib/types';

// --- 模拟数据 ---
const mockPosts: Post[] = [
  { _id: "post_001", type: "pending", timestamp: Date.parse("2023-11-15T10:00:00Z"), sender: { platform: ["wechat"], userid: 10001, nickname: "摄影新手", nick: true }, content: { text: "第一次拍日落，请多指教！", images: ["https://picsum.photos/seed/sunset1/800/600"] }, review: { approve: [], reject: [], comments: [], stat: { approve: 0, reject: 0 } } },
  { _id: "post_002", type: "pending", timestamp: Date.parse("2023-11-15T11:30:00Z"), sender: { platform: ["qq"], userid: 10002, nickname: "抽象派画师", nick: true }, content: { text: "这幅画表达了内心的挣扎。", images: ["https://picsum.photos/seed/abstract2/800/600"] }, review: { approve: [{ mid: 'admin_A', reason: '有创意' }], reject: [{ mid: 'admin_B', reason: '看不懂' }], comments: [], stat: { approve: 1, reject: 1 } } },
  { _id: "post_003", type: "approved", timestamp: Date.parse("2023-11-14T09:00:00Z"), sender: { platform: ["weibo"], userid: 10003, nickname: "萌宠博主", nick: true }, content: { text: "我家猫咪的睡颜~", images: ["https://picsum.photos/seed/cat3/800/600"] }, review: { approve: [{ mid: 'admin_A', reason: '可爱' }, { mid: 'admin_C', reason: '治愈' }], reject: [], comments: [], stat: { approve: 2, reject: 0 } } },
  { _id: "post_004", type: "rejected", timestamp: Date.parse("2023-11-14T14:00:00Z"), sender: { platform: ["qq"], userid: 10004, nickname: "美食家", nick: true }, content: { text: "深夜放毒！", images: ["https://picsum.photos/seed/food4/800/600"] }, review: { approve: [{ mid: 'admin_A', reason: '看起来不错' }], reject: [{ mid: 'admin_B', reason: '图片模糊' }, { mid: 'admin_C', reason: '广告嫌疑' }], comments: [], stat: { approve: 1, reject: 2 } } },
  ...Array.from({ length: 20 }, (_, i) => ({ _id: `post_${100 + i}`, type: "pending" as PostType, timestamp: Date.now() - i * 3600000, sender: { platform: ["qq"], userid: 20000 + i, nickname: `路人甲_${i}`, nick: true }, content: { text: `随手拍 ${i + 1}`, images: [`https://picsum.photos/seed/random${i}/800/600`] }, review: { approve: [], reject: [], comments: [], stat: { approve: 0, reject: 0 } } }))
];

// --- 数据获取函数 ---
async function fetchPostById(id: string): Promise<Post | undefined> {
  await new Promise(res => setTimeout(res, 300));
  return mockPosts.find(post => post._id === id);
}

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const post = await fetchPostById(params.id);
  if (!post) notFound();

  return (
    <div className="bg-white shadow-lg rounded-lg p-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {post.content.images?.length > 0
            ? <img src={post.content.images[0]} alt="Post content" className="w-full rounded-lg shadow-md" />
            : <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg"><p className="text-gray-500">无图片</p></div>
          }
          <p className="text-gray-700 mt-4">{post.content.text}</p>
        </div>
        <div className="md:col-span-1 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">发布者</h3>
            <div className="space-y-1 text-sm">
              <p><strong>昵称:</strong> {post.sender.nickname}</p>
              <p><strong>用户ID:</strong> {post.sender.userid}</p>
              <p><strong>平台:</strong> {post.sender.platform.join(', ')}</p>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">审核详情</h3>
            <div className="space-y-2 text-sm">
              <p><strong>提审时间:</strong> {post.timestamp ? new Date(post.timestamp).toLocaleString('zh-CN') : 'N/A'}</p>
              <p><strong>赞成:</strong> <span className="font-bold text-green-600">{post.review.stat.approve}</span></p>
              <p><strong>反对:</strong> <span className="font-bold text-red-600">{post.review.stat.reject}</span></p>
            </div>
          </div>
        </div>
      </div>
      {post.type === 'pending' && <PostActions postId={post._id} currentType={post.type} />}
    </div>
  );
}