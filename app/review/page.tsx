// app/review/page.tsx
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

/**
 * 帖子数据项类型定义
 */
type PostItem = any;

/**
 * 审核列表页面组件
 * 用于管理员审核用户提交的帖子内容
 */
const ReviewListPage: React.FC = () => {
  // 表格操作引用，用于刷新表格数据
  const actionRef = useRef<ActionType>(null);
  
  // 图片查看器状态管理
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ src: string }[]>([]);

  // 获取消息提示API
  const { message } = App.useApp();

  /**
   * 处理帖子预览功能
   * @param record 帖子记录
   */
  const handlePreview = (record: PostItem) => {
  };

  /**
   * 处理审核操作（批准/拒绝）
   * @param action 审核动作：'approve' 批准 | 'reject' 拒绝
   * @param postId 帖子ID
   */
  const handleReviewAction = async (action: 'approve' | 'reject', postId: string) => {
    // TODO: 从Cookies获取管理员ID
    const midFromCookie = 'user-123-admin';

    // 显示加载提示
    message.loading({ content: '正在处理...', key: 'reviewAction' });

    try {
      // 发送审核请求到后端API
      const response = await axios.post('/api/review', {
        action,
        data: { cid: postId },
        auth: { mid: midFromCookie },
      });

      if (response.data.success) {
        // 操作成功，显示成功消息并刷新表格
        message.success({ content: response.data.message, key: 'reviewAction' });
        actionRef.current?.reload();
      } else {
        throw new Error(response.data.message || '操作失败');
      }
    } catch (error: any) {
      // 处理错误情况
      message.error({
        content: error.response?.data?.message || error.message || '请求失败',
        key: 'reviewAction',
      });
    }
  };

  /**
   * 表格列配置
   */
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
      title: '审核数据',
      dataIndex: 'stat',
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
            {record.stat.approve}
          </span>
          <span>:</span>
          <span
            style={{
              color: '#ff4d4f',
              fontWeight: 'bold',
              fontSize: '15px',
            }}
          >
            {record.stat.reject}
          </span>
        </Space>
      ),
    },
    {
      title: '标签列表',
      dataIndex: 'tags',
      search: false,
      render: (_, record) => (
        <Space wrap size={[0, 8]}>
          {Object.entries(record.tags).flatMap(([level, tags]) => // 遍历标签对象，按风险等级显示不同颜色的标签
            (tags as string[]).map(tag => {
              // 定义不同风险等级对应的颜色
              const colors: { [key: string]: string } = { 
                '通用': '', 
                '高风险': 'volcano', 
                '中风险': 'orange', 
                '低风险': 'magenta' 
              };
              return <Tag key={tag} color={colors[level] || 'default'}>{tag}</Tag>
            })
          )}
        </Space>
      ),
    },
    {
      title: '匿名状态',
      dataIndex: 'nick',
      valueType: 'select',
      valueEnum: { 
        true: { text: '匿名' }, 
        false: { text: '非匿名' } 
      },
    },
    {
      title: '提审时间',
      dataIndex: 'createdAt',
      hideInTable: true, // 在表格中隐藏，仅用于搜索
      valueType: 'dateRange',
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      width: 200,
      render: (text, record) => [
        // 预览
        <a key="preview" onClick={() => handlePreview(record)}>
          预览
        </a>,
        // 批准
        <Popconfirm
          key="approve"
          title="投票给批准？"
          onConfirm={() => handleReviewAction('approve', record._id)}
        >
          <a key="approve" style={{ color: '#52c41a' }} onClick={() => handleReviewAction('approve', record._id)}>
            批准
          </a>
        </Popconfirm>,
        // 拒绝
        <Popconfirm
          key="reject"
          title="投票给拒绝？"
          onConfirm={() => handleReviewAction('reject', record._id)}
        >
          <a style={{ color: 'red' }}>拒绝</a>
        </Popconfirm>,
        // 详情
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
      <ProTable<PostItem> // 审核列表表格
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params) => {
          try {
            // 请求审核列表数据
            const response = await axios.get('/api/review/list', {
              params
            });
            if (response.data.success) {
              return {
                data: response.data.data,
                success: true,
                total: response.data.total,
              };
            }
          } catch (error) {
            console.error('[ReviewList] 请求列表数据失败:', error);
          }
          // 请求失败时返回空数据
          return {
            data: [],
            success: false,
            total: 0,
          };
        }}
        rowKey="_id"
        search={{ labelWidth: 'auto' }}
        pagination={{ 
          defaultPageSize: 10, 
          showSizeChanger: true 
        }}
        dateFormatter="string"
        headerTitle="审核帖子列表"
      />
      <Viewer // 图片查看器组件
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        images={viewerImages}
      />
    </PageContainer>
  );
};

export default ReviewListPage;