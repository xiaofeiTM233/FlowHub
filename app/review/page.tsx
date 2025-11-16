// app/review/page.tsx
'use client';

// React 相关
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 第三方库
import { App, Popconfirm } from 'antd';
import { ActionType, PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Viewer from 'react-viewer';

// 内部组件
import { Stat, Tags } from '@/components/Review';
import itemRender from '@/components/itemRender';

// 样式文件
import 'dayjs/locale/zh-cn';
import 'viewerjs/dist/viewer.css';

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
  // 表格操作引用，用于刷新表格数据
  const actionRef = useRef<ActionType>(null);
  
  // 图片查看器状态管理
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ src: string }[]>([]);

  // 获取消息提示 API
  const { message } = App.useApp();

  // 路由对象
  const router = useRouter();

  // 获取用户会话信息
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      message.warning('请先登录');
      router.push('/dashboard/login');
    },
  }) as { data: any, status: string };

  /**
   * 处理帖子预览功能
   * 打开图片查看器显示帖子图片
   * @param record - 帖子记录数据
   */
  const handlePreview = (record: PostItem) => {
    // 获取帖子中的图片数据
    const images = record.images || [];
    if (images.length === 0) {
      message.info('该帖子没有图片内容');
      return;
    }
    // 转换图片数据格式为 Viewer 组件需要的格式
    const viewerImageList = images.map((img: string) => {
      const src = `data:image/png;base64,${img}`;
      return {
        src,
        alt: '预览图'
      };
    });
    
    // 设置图片数据并显示查看器
    setViewerImages(viewerImageList);
    setViewerVisible(true);
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
   * ProTable 表格列配置
   * 定义审核列表的各个列及其渲染方式
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
        // 预览操作
        <a 
          key="preview" 
          onClick={() => handlePreview(record)}
        >
          预览
        </a>,
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
        
        // 详情页面链接
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
      <Viewer
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        images={viewerImages}
      />
    </PageContainer>
  );
};

export default ReviewListPage;
