// app/settings/moderators/page.tsx
'use client';

// React 相关
import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// 第三方库
import { App, Tag, Tooltip, Button } from 'antd';
import { PageContainer, ProTable, ProColumns, ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
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
type ModeratorItem = {
  _id?: string;
  mid: string;
  role: string;
  key?: string;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * 审核员管理页面组件
 */
const ModeratorPage: React.FC = () => {
  // 初始化
  const { message } = App.useApp();
  const router = useRouter();
  const actionRef = useRef<any>(null);

  // 认证状态管理
  const { data: session } = useSession({
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
   * 编辑审核员
   */
  const handleSave = async (values: any) => {
    try {
      const res = await axios.post('/api/settings/moderators', values);
      if (res.data?.code === 0) {
        message.success('操作成功');
        actionRef.current?.reload();
        return true;
      } else {
        message.error(res.data?.message || '操作失败');
        return false;
      }
    } catch (e: any) {
      message.error(e.response?.data?.message || '操作失败');
      return false;
    }
  };

  /**
   * 表格列配置
   */
  const columns: ProColumns<ModeratorItem>[] = [
    {
      title: '审核员ID',
      dataIndex: 'mid',
      valueType: 'text',
      copyable: true,
    },
    {
      title: '角色',
      dataIndex: 'role',
      valueType: 'select',
      valueEnum: {
        all: { text: '全部', status: 'Default' },
        sysop: { text: '超级管理员', status: 'Error' },
        admin: { text: '管理员', status: 'Warning' },
        moderator: { text: '审核员', status: 'Processing' },
      },
      render: (_, record) => {
        const roleMap: Record<string, { color: string; label: string }> = {
          sysop: { color: 'red', label: '超级管理员' },
          admin: { color: 'orange', label: '管理员' },
          moderator: { color: 'blue', label: '审核员' },
        };
        const role = roleMap[record.role] || { color: 'default', label: record.role };
        return <Tag color={role.color}>{role.label}</Tag>;
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      valueType: 'dateTime',
      search: false,
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
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      render: (_, record) => (
        <ModalForm
          title="编辑审核员"
          trigger={<Button type="link" size="small">编辑</Button>}
          initialValues={record}
          onFinish={handleSave}
        >
          <ProFormText
            name="mid"
            label="审核员ID"
            rules={[{ required: true, message: '请输入审核员ID' }]}
            disabled
          />
          <ProFormSelect
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
            options={[
              { label: '超级管理员', value: 'sysop' },
              { label: '管理员', value: 'admin' },
              { label: '审核员', value: 'moderator' },
            ]}
          />
          <ProFormText
            name="key"
            label="密钥"
            placeholder="如不填写则不修改"
          />
        </ModalForm>
      ),
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
            title: '系统管理'
          },
          {
            path: '/settings/moderators',
            title: '审核员管理'
          }
        ],
        itemRender,
      }}
    >
      <ProTable<ModeratorItem>
        rowKey="_id"
        headerTitle="审核员列表"
        columns={columns}
        cardBordered
        actionRef={actionRef}
        toolBarRender={() => [
          <ModalForm
            key="create"
            title="新增审核员"
            trigger={<Button type="primary">新增审核员</Button>}
            onFinish={handleSave}
          >
            <ProFormText
              name="mid"
              label="审核员ID"
              rules={[{ required: true, message: '请输入审核员ID' }]}
              placeholder="请输入审核员ID"
            />
            <ProFormSelect
              name="role"
              label="角色"
              rules={[{ required: true, message: '请选择角色' }]}
              options={[
                { label: '超级管理员', value: 'sysop' },
                { label: '管理员', value: 'admin' },
                { label: '审核员', value: 'moderator' },
              ]}
            />
            <ProFormText
              name="key"
              label="密钥"
              placeholder="如不填写则不修改"
            />
          </ModalForm>
        ]}
        // 列表数据请求
        request={async params => {
          try {
            // 过滤掉 "all" 值
            const searchParams = { ...params };
            if (searchParams.role === 'all') {
              delete searchParams.role;
            }
            const res = await axios.get('/api/settings/moderators', { params: searchParams });
            if (res.data && res.data.code === 0) {
              return {
                data: res.data.data.records || res.data.data || [],
                total: res.data.data.total || (res.data.data.records || []).length,
                success: true,
              };
            }
          } catch (e) {
            console.error('[Moderator] 获取列表失败', e);
          }
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

export default ModeratorPage;
