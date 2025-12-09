// app/posts/list/page.tsx
'use client';

// React 相关
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// 第三方库
import { App, Image, Card, Segmented } from 'antd';
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
  // 视图模式状态：表格或瀑布流
  const [viewMode, setViewMode] = useState<'table' | 'waterfall'>('table');

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
      render: (_, record) => [
        <Link key="detail" href={`/posts/${record._id}`}>详情</Link>,
        <a key="preview" onClick={() => handlePreview(record)}>预览</a>,
      ],
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
              backgroundImage: `url(data:image/png;base64,${record.images[0]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
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
        <Link key="detail" href={`/posts/${record._id}`}>详情</Link>,
        <a key="preview" onClick={() => handlePreview(record)}>预览</a>,
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
              ID: {record._id} ({record.timestamp})
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {record.images?.length ? `${record.images.length} 张图片` : '无图片'}
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
