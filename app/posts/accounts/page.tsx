// app/posts/accounts/page.tsx
'use client';

// React 相关
import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// 第三方库
import { App, Tag, Tooltip, Modal, Form, Input, Select, Button } from 'antd';
import { PageContainer, ProTable, ProColumns, ActionType } from '@ant-design/pro-components';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// 内部组件
import itemRender from '@/components/itemRender';

// dayjs 配置
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { TextArea } = Input;

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
  // 表格 action 引用（用于刷新）
  const actionRef = useRef<ActionType>(undefined);
  // 弹窗状态
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AccountItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // 权限判断：仅 sysop 可操作
  const isSysop = session?.user?.role === 'sysop';

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * 打开新建弹窗
   */
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  /**
   * 打开编辑弹窗
   */
  const handleEdit = (record: AccountItem) => {
    setEditingRecord(record);
    form.setFieldsValue({
      platform: record.platform,
      aid: record.aid,
      uid: record.uid,
      auth: record.auth ? JSON.stringify(record.auth, null, 2) : '',
      cookies: record.cookies ? JSON.stringify(record.cookies, null, 2) : '',
      stats: record.stats ? JSON.stringify(record.stats, null, 2) : '',
    });
    setModalOpen(true);
  };

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 解析 JSON 字段
      const payload: Record<string, any> = {
        platform: values.platform,
        aid: values.aid,
        uid: values.uid,
      };
      if (values.auth) {
        try { payload.auth = JSON.parse(values.auth) || {}; } catch { throw new Error('auth 格式错误，请检查 JSON'); }
      }
      if (values.cookies) {
        try { payload.cookies = JSON.parse(values.cookies) || {}; } catch { throw new Error('cookies 格式错误，请检查 JSON'); }
      }
      if (values.stats) {
        try { payload.stats = JSON.parse(values.stats) || {}; } catch { throw new Error('stats 格式错误，请检查 JSON'); }
      }

      const res = await axios.post('/api/accounts/create', payload);
      if (res.data?.code === 0) {
        message.success(editingRecord ? '账号更新成功' : '账号创建成功');
        setModalOpen(false);
        actionRef.current?.reload();
      } else {
        message.error(res.data?.message || '操作失败');
      }
    } catch (e: any) {
      if (e.errorFields) return; // 表单验证错误
      message.error(e.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

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
    ...(isSysop ? [{
      title: '操作',
      valueType: 'option' as const,
      width: 100,
      render: (_: any, record: AccountItem) => [
        <a key="edit" onClick={() => handleEdit(record)}>编辑</a>,
      ],
    }] : []),
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
        actionRef={actionRef}
        headerTitle="账号列表"
        columns={columns}
        cardBordered
        toolBarRender={() => [
          isSysop && (
            <Button key="add" type="primary" onClick={handleAdd}>新建账号</Button>
          ),
        ].filter(Boolean)}
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

      {/* 添加/编辑弹窗 */}
      <Modal
        open={modalOpen}
        title={editingRecord ? '编辑账号' : '新建账号'}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="platform" label="平台类型" rules={[{ required: true, message: '请选择平台类型' }]}>
            <Select placeholder="请选择平台" options={[
              { label: 'B站 (bili)', value: 'bili' },
              { label: 'QQ空间 (qzone)', value: 'qzone' },
            ]} />
          </Form.Item>
          <Form.Item name="aid" label="内部账号 ID (aid)" rules={[{ required: true, message: '请输入 aid' }]} tooltip="账号唯一标识，不可重复">
            <Input placeholder="如 bili_01" disabled={!!editingRecord} />
          </Form.Item>
          <Form.Item name="uid" label="平台用户 ID (uid)" rules={[{ required: true, message: '请输入 uid' }]}>
            <Input placeholder="平台的用户 ID" />
          </Form.Item>
          <Form.Item name="auth" label="认证配置 (auth)" tooltip="JSON 格式，如 { url, token }">
            <TextArea rows={3} placeholder='{"url": "...", "token": "..."}' />
          </Form.Item>
          <Form.Item name="cookies" label="Cookies (cookies)" tooltip="JSON 格式">
            <TextArea rows={4} placeholder='{"SESSDATA": "...", "bili_jct": "..."}' />
          </Form.Item>
          <Form.Item name="stats" label="统计信息 (stats)" tooltip="JSON 格式（选填）">
            <TextArea rows={2} placeholder='{}' />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default AccountListPage;
