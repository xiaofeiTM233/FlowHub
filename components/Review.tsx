// components/Review.tsx
import React from 'react';
import { Badge, Flex, Space, Tag } from 'antd';

interface StatProps {
  approve: number;
  reject: number;
}

interface ReviewStatusProps {
  status: 'pending' | 'approved' | 'rejected';
}

const Tags: React.FC<any> = ({ tags, platform = [] }) => {
  if (platform.length > 0) {
    // 如果传入平台列表，直接转换成标签
    return (
      <Flex gap="small" align="center" wrap>
        {(platform as string[]).map(tag => (
          <Tag key={tag} variant='outlined'>
            {tag}
          </Tag>
        ))}
      </Flex>
    );
  }
  // 定义不同风险等级对应的颜色
  const colors: { [key: string]: string } = { 
    '通用': '', 
    '高风险': 'volcano', 
    '中风险': 'orange', 
    '低风险': 'magenta' 
  };
  return (
    <Flex gap="small" align="center" wrap>
      {Object.entries(tags).flatMap(([level, tagList]) => 
        // 遍历标签对象，按风险等级显示不同颜色的标签
        (tagList as string[]).map(tag => (
          <Tag key={`${level}-${tag}`} color={colors[level] || 'default'} variant='outlined'>
            {tag}
          </Tag>
        ))
      )}
    </Flex>
  );
};

const Stat: React.FC<StatProps> = ({ approve, reject }) => {
  return (
    <Space>
      <span
        style={{
          color: '#52c41a',
          fontWeight: 'bold',
          fontSize: '15px',
        }}
      >
        {approve}
      </span>
      <span>:</span>
      <span
        style={{
          color: '#ff4d4f',
          fontWeight: 'bold',
          fontSize: '15px',
        }}
      >
        {reject}
      </span>
    </Space>
  );
};

const ReviewStatus: React.FC<ReviewStatusProps> = ({ status }) => {
  const statusConfig = {
    pending: { text: '审核中', status: 'processing' as const },
    approved: { text: '已通过', status: 'success' as const },
    rejected: { text: '已拒绝', status: 'error' as const },
  };
  const config = statusConfig[status];
  return (
    <Badge status={config.status} text={config.text} />
  );
};

export { Tags, Stat, ReviewStatus };
