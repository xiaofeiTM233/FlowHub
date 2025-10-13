// components/PostTable.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Post, PostType } from '@/lib/types';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import dynamic from 'next/dynamic';
const Viewer = dynamic(
  () => import('react-viewer'),
  { ssr: false }
);

interface Props {
  posts: Post[];
}

const PostTable: React.FC<Props> = ({ posts }) => {
  const router = useRouter();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [previewImgs, setPreviewImgs] = useState<{ src: string }[]>([]);
  const [loadingPostId, setLoadingPostId] = useState<string | null>(null);

  const showViewer = (images: string[]) => {
    if (images?.length > 0) {
      setPreviewImgs(images.map(img => ({ src: img })));
      setIsViewerOpen(true);
    }
  };

  const onQuickReview = async (postId: string, newType: 'approved' | 'rejected') => {
    setLoadingPostId(postId);
    
    try {
      await axios.post('/api/review', {
        action: newType,
        data: { cid: postId },
        auth: { mid: document.cookie.match(/mid=([^;]+)/)?.[1] }
      });
      router.refresh(); // 刷新数据
    } catch (error) {
      console.error('审核操作失败:', error);
    } finally {
      setLoadingPostId(null);
    }
  };

  const renderTypeChip = (type: PostType) => {
    const styles: Record<PostType, string> = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' };
    const text: Record<PostType, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[type]}`}>{text[type]}</span>;
  };

  return (
    <>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">发布者</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">审核票数</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">提审时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.map((post) => (
              <tr key={post._id} className={loadingPostId === post._id ? 'opacity-50' : ''}>
                <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{post.sender.nickname}</div><div className="text-sm text-gray-500">ID: {post.sender.userid}</div></td>
                <td className="px-6 py-4">{renderTypeChip(post.type)}</td>
                <td className="px-6 py-4 text-sm"><span className="text-green-600 font-semibold">{post.review.stat.approve}</span> : <span className="text-red-600 font-semibold">{post.review.stat.reject}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{post.timestamp ? new Date(post.timestamp).toLocaleString('zh-CN') : 'N/A'}</td>
                <td className="px-6 py-4 text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => showViewer(post.content.images)} disabled={!post.content.images?.length} className="text-blue-600 hover:text-blue-900 disabled:text-gray-400">预览</button>
                    {post.type === 'pending' && (<>
                      <button onClick={() => onQuickReview(post._id, 'approved')} disabled={!!loadingPostId} className="text-green-600 hover:text-green-900 disabled:text-gray-400">通过</button>
                      <button onClick={() => onQuickReview(post._id, 'rejected')} disabled={!!loadingPostId} className="text-red-600 hover:text-red-900 disabled:text-gray-400">拒绝</button>
                    </>)}
                    <Link href={`/review/${post._id}`} className="text-gray-600 hover:text-gray-900">详情</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Viewer visible={isViewerOpen} onClose={() => setIsViewerOpen(false)} images={previewImgs} />
    </>
  );
};

export default PostTable;