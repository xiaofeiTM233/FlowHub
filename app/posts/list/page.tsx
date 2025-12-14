// app/posts/list/page.tsx
'use client';

// React 相关
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// 第三方库
import { App, Image, Card, Segmented, Popconfirm } from 'antd';
import { ActionType, PageContainer, ProTable, ProColumns } from '@ant-design/pro-components';
import { BarsOutlined, AppstoreOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// 内部组件
import itemRender from '@/components/itemRender';

// dayjs 配置
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

// 类型定义
type PostItem = any;

const PostListPage: React.FC = () => {
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
    const images = record.images || [];
    if (images.length === 0) {
      message.info('该帖子没有图片');
      return;
    }
    const srcList = images.map((img: string) => img);
    setPreviewImages(srcList);
    setPreviewCurrent(0);
    setPreviewVisible(true);
  };

  // 处理发布功能
  const handlePublish = async (record: PostItem) => {
    try {
      setPublishing(record._id);
      const response = await axios.post('/api/posts/publish', { _id: record._id });
      if (response.data?.code === 0) {
        message.success('发布成功');
        // 刷新列表数据
        actionRef.current?.reload();
      } else {
        message.error(response.data?.message || '发布失败');
      }
    } catch (error: any) {
      console.error('[PostList] 发布失败:', error);
      message.error(error.response?.data?.message || '发布失败，请重试');
    } finally {
      setPublishing(null);
    }
  };

  // 处理删帖功能
  const handleDelete = async (record: PostItem) => {
    try {
      setDeleting(record._id);
      const response = await axios.post('/api/posts/delete', { _id: record._id });
      if (response.data?.code === 0) {
        message.success('删帖成功');
        // 刷新列表数据
        actionRef.current?.reload();
      } else {
        message.error(response.data?.message || '删帖失败');
      }
    } catch (error: any) {
      console.error('[PostList] 删帖失败:', error);
      message.error(error.response?.data?.message || '删帖失败，请重试');
    } finally {
      setDeleting(null);
    }
  };
  // 视图模式状态：表格或瀑布流
  const [viewMode, setViewMode] = useState<'table' | 'waterfall'>('table');
  // 发布状态管理
  const [publishing, setPublishing] = useState<string | null>(null);
  // 删帖状态管理
  const [deleting, setDeleting] = useState<string | null>(null);

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
          <Link key="id" href={`/posts/${record._id}`}>
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
      title: '帖子状态',
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: {
        draft: { text: '草稿', status: 'Processing' },
        published: { text: '已发布', status: 'Success' },
        deleted: { text: '已删帖', status: 'Success' },
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      render: (_, record) => (
        <div>
          {record.title || '无标题'}
        </div>
      ),
    },
    {
      title: '图片',
      dataIndex: 'images',
      search: false,
      render: (_, record) => (
        <a onClick={() => handlePreview(record)}>
          {record.images?.length ? `查看 (${record.images.length})` : '无'}
        </a>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      render: (_, record) => {
        const actions = [
          <Link key="detail" href={`/posts/${record._id}`}>详情</Link>,
          <a key="preview" onClick={() => handlePreview(record)}>预览</a>,
        ];
        
        // 如果是草稿状态，添加发布链接
        if (record.type === 'draft') {
          if (publishing === record._id) {
            actions.push(
              <a 
                key="publish" 
                style={{ 
                  color: 'rgb(82, 196, 26)',
                  cursor: 'not-allowed',
                  opacity: 0.6
                }}
              >
                发布中...
              </a>
            );
          } else {
            actions.push(
              <Popconfirm
                key="publish"
                title="确认发布这个帖子？"
                onConfirm={() => handlePublish(record)}
                okText="确认"
                cancelText="取消"
              >
                <a style={{ color: 'rgb(82, 196, 26)' }}>
                  发布
                </a>
              </Popconfirm>
            );
          }
        }
        
        // 如果是已发布状态，添加删帖按钮
        if (record.type === 'published') {
          if (deleting === record._id) {
            actions.push(
              <a 
                key="delete" 
                style={{ 
                  color: 'red',
                  cursor: 'not-allowed',
                  opacity: 0.6
                }}
              >
                删除中...
              </a>
            );
          } else {
            actions.push(
              <Popconfirm
                key="delete"
                title="确认删除这个帖子？"
                onConfirm={() => handleDelete(record)}
                okText="确认"
                cancelText="取消"
              >
                <a style={{ color: 'red' }}>
                  删帖
                </a>
              </Popconfirm>
            );
          }
        }
        
        return actions;
      },
    },
  ];

  // 瀑布流卡片组件
  const WaterfallCard: React.FC<{ record: PostItem }> = ({ record }) => (
    <Card
      hoverable
      cover={
        record.images && record.images.length > 0 ? (
          <div
            style={{
              height: 200,
              backgroundImage: `url(${record.images[0]})`,
              backgroundSize: 'cover',
            }}
            onClick={() => handlePreview(record)}
          />
        ) : (
          <div
            style={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              color: '#999',
            }}
          >
            无图片
          </div>
        )
      }
      actions={[
        <Link key="detail" href={`/posts/${record._id}`} style={{ color: '#1890ff' }}>详情</Link>,
        <a key="preview" onClick={() => handlePreview(record)} style={{ color: '#1890ff' }}>预览</a>,
        ...(record.type === 'draft' ? 
          (publishing === record._id ? [
            <a 
              key="publish"
              style={{ 
                color: 'rgb(82, 196, 26)',
                cursor: 'not-allowed',
                opacity: 0.6
              }}
            >
              发布中...
            </a>
          ] : [
            <Popconfirm
              key="publish"
              title="确认发布这个帖子？"
              onConfirm={() => handlePublish(record)}
              okText="确认"
              cancelText="取消"
            >
              <a style={{ color: 'rgb(82, 196, 26)' }}>
                发布
              </a>
            </Popconfirm>
          ]) : []
        ),
        ...(record.type === 'published' ? 
          (deleting === record._id ? [
            <a 
              key="delete"
              style={{ 
                color: 'red',
                cursor: 'not-allowed',
                opacity: 0.6
              }}
            >
              删除中...
            </a>
          ] : [
            <Popconfirm
              key="delete"
              title="确认删除这个帖子？"
              onConfirm={() => handleDelete(record)}
              okText="确认"
              cancelText="取消"
            >
              <a style={{ color: 'red' }}>
                删帖
              </a>
            </Popconfirm>
          ]) : []
        )
      ]}
    >
      <Card.Meta
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{record.title || '无标题'}</span>
            <span style={{ fontSize: '12px', color: '#999' }}>
              {dayjs(record.createdAt).format('MM-DD')}
            </span>
          </div>
        }
        description={
          <div>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: 8 }}>
              ID: {record._id} ({record.timestamp}) {record.images?.length ? `${record.images.length} 张图片` : '无图片'}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              内容：{record.text ? (record.text.length > 30 ? `${record.text.slice(0, 30)}...` : record.text) : '无内容'}
            </div>
          </div>
        }
      />
    </Card>
  );

  // 自定义渲染函数 - 根据视图模式渲染不同的布局
  const tableViewRender = (props: any, dom: React.ReactNode) => {
    // 表格模式：返回默认渲染
    if (viewMode === 'table') {
      return dom;
    }
    // 瀑布流模式
    const { dataSource = [], loading } = props;
    if (loading) {
      return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>;
    }
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
          padding: '16px 0',
        }}
      >
        {dataSource.map((record: PostItem) => (
          <WaterfallCard key={record._id} record={record} />
        ))}
      </div>
    );
  };

  return (
    <PageContainer
      header={{ title: '' }}
      breadcrumb={{
        items: [
          {
            path: '/posts/list',
            title: '帖子列表',
          },
        ],
        itemRender,
      }}
    >
      <ProTable<PostItem>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params) => {
          try {
            // 请求列表数据
            const response = await axios.get('/api/posts/list', { params });
            if (response.data?.code === 0) {
              return {
                data: response.data.data.records,
                total: response.data.data.total,
                success: true,
              };
            }
          } catch (error) {
            console.error('[PostList] 请求数据失败:', error);
          }
          // 请求失败时返回空数据
          return {
            data: [],
            success: false,
            total: 0,
          };
        }}
        rowKey="_id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
        }}
        dateFormatter="string"
        headerTitle="帖子列表"
        tableViewRender={tableViewRender}
        search={{
          labelWidth: 'auto',
          optionRender: (searchConfig, formProps, dom) => [
            <Segmented
              key="view-mode"
              value={viewMode}
              onChange={(value) => setViewMode(value as 'table' | 'waterfall')}
              options={[
                {
                  icon: <BarsOutlined />,
                  value: 'table',
                },
                {
                  icon: <AppstoreOutlined />,
                  value: 'waterfall',
                },
              ]}
            />,
            ...dom.reverse()
          ],
        }}
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

export default PostListPage;
