'use client';

import React, { useRef, useState } from 'react';
import {
  ActionType,
  PageContainer,
  ProTable,
} from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { App, Badge, Popconfirm, Space, Tag } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import Link from 'next/link';

import Viewer from 'react-viewer';
import 'viewerjs/dist/viewer.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

type PostItem = any;

const ReviewListPage: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ src: string }[]>([]);

  const { message } = App.useApp();

  const handlePreview = (record: PostItem) => {};

  const handleReviewAction = async (action: 'approve' | 'reject', postId: string) => {
    // 测试参数，到时候改
    const midFromCookie = 'user-123-admin';
    message.loading({ content: '正在处理...', key: 'reviewAction' });

    try {
      const response = await axios.post('/api/review', {
        action,
        data: { cid: postId },
        auth: { mid: midFromCookie },
      });

      if (response.data.success) {
        message.success({ content: response.data.message, key: 'reviewAction' });
        actionRef.current?.reload();
      } else {
        throw new Error(response.data.message || '操作失败');
      }
    } catch (error: any) {
      message.error({
        content: error.response?.data?.message || error.message || '请求失败',
        key: 'reviewAction',
      });
    }
  };


  const columns: ProColumns<PostItem>[] = [
    {
      title: '发布者',
      dataIndex: 'publisher',
      render: (_, record) => (
        <>
          <span>{record.content.nickname}</span>
          <span
            style={{
              marginLeft: '8px',
              color: '#8c8c8c',
              fontSize: '12px',
            }}
          >
            (ID: {record.content.userid})
          </span>
        </>
      ),
    },
    {
      title: '审核状态',
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: {
        pending: { text: '审核中', status: 'Processing' },
        approved: { text: '已通过', status: 'Success' },
        rejected: { text: '已拒绝', status: 'Error' },
      },
    },
    {
      title: '标签列表',
      dataIndex: 'tags',
      search: false,
      render: (_, record) => (
        <Space wrap size={[0, 8]}>
          {Object.entries(record.tags).flatMap(([level, tags]) =>
            (tags as string[]).map(tag => {
              const colors: { [key: string]: string } = { '通用': '', '高风险': 'volcano', '中风险': 'orange', '低风险': 'magenta' };
              return <Tag key={tag} color={colors[level] || 'default'}>{tag}</Tag>
            })
          )}
        </Space>
      ),
    },
    {
      title: '审核数据',
      dataIndex: 'reviewData',
      search: false,
      align: 'center',
      render: (_, record) => (
        <Space>
          <span
            style={{
              color: '#52c41a',
              fontWeight: 'bold',
              fontSize: '15px',
            }}
          >
            {record.review.stat.approve}
          </span>
          <span>:</span>
          <span
            style={{
              color: '#ff4d4f',
              fontWeight: 'bold',
              fontSize: '15px',
            }}
          >
            {record.review.stat.reject}
          </span>
        </Space>
      ),
    },
    {
      title: '提审时间',
      dataIndex: 'createdAt',
      valueType: 'dateRange',
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '匿名状态',
      dataIndex: ['sender', 'nick'],
      hideInTable: true,
      valueType: 'select',
      valueEnum: { true: { text: '匿名' }, false: { text: '非匿名' } },
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      width: 200,
      render: (text, record) => [
        <a key="preview" onClick={() => handlePreview(record)}>
          预览
        </a>,
        <Popconfirm
          key="approve"
          title="投票给批准？"
          onConfirm={() => handleReviewAction('approve', record._id)}
        >
          <a key="approve" style={{ color: '#52c41a' }} onClick={() => handleReviewAction('approve', record._id)}>
            批准
          </a>
        </Popconfirm>,
        <Popconfirm
          key="reject"
          title="投票给拒绝？"
          onConfirm={() => handleReviewAction('reject', record._id)}
        >
          <a style={{ color: 'red' }}>拒绝</a>
        </Popconfirm>,
        <Link key="details" href={`/review/${record._id}`}>
          详情
        </Link>,
      ],
    },
  ];

  return (
    <PageContainer
      header={{
        title: '',
      }}
    >
      <ProTable<PostItem>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params) => {
          //console.log('ProTable params:', params);
          const response = await axios.get('/api/review/list');
          return {
            data: response.data.data,
            success: response.data.success,
            total: response.data.total,
          };
        }}
        rowKey="_id"
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        dateFormatter="string"
        headerTitle="审核帖子列表"
      />

      <Viewer
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        images={viewerImages}
      />
    </PageContainer>
  );
};

export default ReviewListPage;