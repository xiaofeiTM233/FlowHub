// app/posts/accounts/page.tsx
'use client';

// React 相关
import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// 第三方库
import { App, Tag, Tooltip } from 'antd';
import { PageContainer, ProTable, ProColumns } from '@ant-design/pro-components';
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
type AccountItem = {
  _id?: string;
  platform: string;
  aid: string;
  uid: string;
  auth?: any;
  cookies?: any;
  stats?: any;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * 账号列表页面组件
 */
const AccountListPage: React.FC = () => {
  // 初始化
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
  // 防止卸载后调用导致的样式/消息警告
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * 表格列配置
   */
  const columns: ProColumns<AccountItem>[] = [
    {
      title: '内部账号ID (aid)',
      dataIndex: 'aid',
      valueType: 'text',
    },
    {
      title: '平台用户ID (uid)',
      dataIndex: 'uid',
      valueType: 'text',
    },
    {
      title: '平台',
      dataIndex: 'platform',
      valueType: 'text',
      render: (_, record) => (
        <Tag key={record.aid} color="blue">
          {record.platform || '未知'}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => {
        const t = record.updatedAt || record.createdAt;
        if (!t) return '-';
        const formatted = dayjs(t).format('YYYY-MM-DD HH:mm');
        const relative = dayjs(t).fromNow();
        return (
          <Tooltip title={relative}>
            <span>{formatted}</span>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <PageContainer
      header={{
        title: ''
      }}
      breadcrumb={{
        items: [
          {
            path: '/accounts',
            title: '平台账号管理'
          }
        ],
        itemRender,
      }}
    >
      <ProTable<AccountItem>
        rowKey="aid"
        headerTitle="账号列表"
        columns={columns}
        cardBordered
        // 列表数据请求
        request={async params => {
          try {
            // 请求列表数据
            const res = await axios.get('/api/accounts/list', { params });
            if (res.data && res.data.code === 0) {
              return {
                data: res.data.data.records || res.data.data || [],
                total: res.data.data.total || (res.data.data.records || []).length,
                success: true,
              };
            }
          } catch (e) {
            console.error('[AccountList] 获取列表失败', e);
          }
          // 请求失败时返回空数据
          return {
            data: [],
            success: false,
            total: 0
          };
        }}
        search={{
          labelWidth: 'auto'
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true
        }}
      />
    </PageContainer>
  );
};

export default AccountListPage;
