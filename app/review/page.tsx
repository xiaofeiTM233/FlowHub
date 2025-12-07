// app/review/page.tsx
'use client';

// React 相关
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 第三方库
import { App, Popconfirm, Image } from 'antd';
import { ActionType, PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// 内部组件
import { Stat, Tags } from '@/components/Review';
import itemRender from '@/components/itemRender';

// dayjs 配置
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

/**
 * 帖子数据项类型定义
 */
type PostItem = any;

/**
 * 审核列表页面组件
 * 用于管理员审核用户提交的帖子内容
 * 提供帖子列表展示、审核操作、预览等功能
 */
const ReviewListPage: React.FC = () => {
  // 初始化
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const router = useRouter();
  // 认证状态管理
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      message.warning('请先登录');
      router.push('/dashboard/login');
    },
  }) as { data: any; status: string };
  // 图片查看器状态管理
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewCurrent, setPreviewCurrent] = useState<number>(0);
  // 处理图片预览功能
  const handlePreview = (record: PostItem) => {
    // 获取帖子中的图片数据
    const images = record.images || [];
    if (images.length === 0) {
      message.info('该帖子没有图片');
      return;
    }
    // 转换为 antd Image 需要的 src 列表并打开预览
    const srcList = images.map((img: string) => `data:image/png;base64,${img}`);
    setPreviewImages(srcList);
    setPreviewCurrent(0);
    setPreviewVisible(true);
  };

  /**
   * 处理审核操作（批准/拒绝）
   * 向后端发送审核请求并处理响应结果
   * @param action - 审核动作：'approve' 批准 | 'reject' 拒绝
   * @param postId - 帖子唯一标识ID
   */
  const handleReviewAction = async (action: 'approve' | 'reject', postId: string) => {
    // 显示加载提示
    message.loading({ content: '正在处理...', key: 'reviewAction' });
    try {
      // 发送审核请求到后端 API
      const response = await axios.post('/api/review', {
        action,
        data: { cid: postId },
        auth: { mid: session?.user?.mid  },
      });
      if (response.data.success) {
        // 操作成功，显示成功消息并刷新表格数据
        message.success({ 
          content: response.data.message, 
          key: 'reviewAction' 
        });
        actionRef.current?.reload();
      } else {
        throw new Error(response.data.message || '操作失败');
      }
    } catch (error: any) {
      // 处理错误情况，显示详细错误信息
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
      title: '帖子ID',
      dataIndex: '_id',
      search: false,
      render: (_, record) => (
        <>
          <Link key="id" href={`/review/${record._id}`}>
            {record._id}
          </Link>
          <span
            style={{
              marginLeft: '8px',
              color: '#8c8c8c',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          >
            ({record.timestamp})
          </span>
        </>
      ),
    },
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
        <Stat 
          approve={record.stat.approve} 
          reject={record.stat.reject} 
        />
      ),
    },
    {
      title: '标签列表',
      dataIndex: 'tags',
      search: false,
      render: (_, record) => (
        <Tags tags={record.tags} />
      ),
    },
    {
      title: '匿名状态',
      dataIndex: 'anonymous',
      valueType: 'select',
      valueEnum: { 
        true: { text: '匿名' }, 
        false: { text: '非匿名' } 
      },
    },
    {
      title: '提审时间',
      dataIndex: 'createdAt',
      hideInTable: true, // 在表格中隐藏，仅用于搜索筛选
      valueType: 'dateRange',
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      width: 200,
      render: (_, record) => [
        // 详情页面链接
        <Link key="details" href={`/review/${record._id}`}>
          详情
        </Link>,
        // 预览操作
        <a 
          key="preview" 
          onClick={() => handlePreview(record)}
        >
          预览
        </a>,
        ...(record.type === 'pending'
          ? [
            // 批准操作 - 带确认弹窗
            <Popconfirm
              key="approve"
              title="确认批准这个帖子？"
              onConfirm={() => handleReviewAction('approve', record._id)}
              okText="确认"
              cancelText="取消"
            >
              <a style={{ color: '#52c41a' }}>
                批准
              </a>
            </Popconfirm>,
            // 拒绝操作 - 带确认弹窗
            <Popconfirm
              key="reject"
              title="确认拒绝这个帖子？"
              onConfirm={() => handleReviewAction('reject', record._id)}
              okText="确认"
              cancelText="取消"
            >
              <a style={{ color: 'red' }}>
                拒绝
              </a>
            </Popconfirm>,
            ]
          : []
        ),
      ],
    },
  ];

  return (
    <PageContainer
      header={{
        title: '',
      }}
      breadcrumb={{
        items: [
          {
            path: '/review',
            title: '帖子审核',
          },
        ],
        itemRender
      }}
    >
      {/* 审核列表主表格 */}
      <ProTable<PostItem>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params) => {
          try {
            // 请求列表数据
            const response = await axios.get('/api/review/list', { params });
            if (response.data.code === 0) {
              return {
                data: response.data.data.records,
                total: response.data.data.total,
                success: true,
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
        search={{ 
          labelWidth: 'auto' 
        }}
        pagination={{ 
          defaultPageSize: 10, 
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`
        }}
        dateFormatter="string"
        headerTitle="审核帖子列表"
      />
      
      {/* 图片查看器组件 */}
      <Image.PreviewGroup
        preview={{
          open: previewVisible,
          onOpenChange: (open) => setPreviewVisible(open),
          current: previewCurrent,
        }}
      >
        {previewImages.map((src, idx) => (
          <Image key={idx} src={src} style={{ display: 'none' }} />
        ))}
      </Image.PreviewGroup>
    </PageContainer>
  );
};

export default ReviewListPage;
