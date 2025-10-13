// app/review/[id]/PostActions.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PostType } from '@/lib/types';

interface Props {
  postId: string;
  currentType: PostType;
}

const PostActions: React.FC<Props> = ({ postId, currentType }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onReview = async (newType: 'approved' | 'rejected') => {
    setLoading(true);
    await new Promise(res => setTimeout(res, 500));
    alert(`模拟操作：帖子 ${postId} 已被 ${newType}。`);
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 flex space-x-4 items-center">
      <h3 className="text-lg font-semibold text-gray-700">审核操作:</h3>
      <button onClick={() => onReview('approved')} disabled={loading || currentType !== 'pending'} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50">通过</button>
      <button onClick={() => onReview('rejected')} disabled={loading || currentType !== 'pending'} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50">拒绝</button>
    </div>
  );
};

export default PostActions;