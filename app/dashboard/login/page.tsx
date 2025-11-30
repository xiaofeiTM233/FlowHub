// app/login/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button, Input, Card, Form, App } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import itemRender from '@/components/itemRender';

/**
 * 登录页面主组件
 * @returns 登录页面 JSX 元素
 */
export default function LoginPage() {
  // 路由导航
  const router = useRouter();
  // 消息提示
  const { message } = App.useApp();

  /**
   * 表单提交处理函数
   * @param {Object} values - 表单提交的值
   */
  const onFinish = async (values: { key: string }) => {
    // 进行登录
    const result = await signIn('credentials', {
      redirect: false, // 禁用自动重定向，手动处理跳转逻辑
      key: values.key, // 传递用户输入的密码
    });

    // 根据认证结果处理后续逻辑
    if (!result?.error) {
      // 登录成功：显示成功消息并跳转到仪表板
      message.success('登录成功！正在跳转…');
      router.replace('/dashboard/index');
    } else {
      // 登录失败：显示错误消息
      message.error('登录失败，请检查密码是否正确');
    }
  };

  return (
    <PageContainer
      header={{
        title: '',
      }}
      breadcrumb={{
        items: [
          {
            path: '/dashboard',
            title: '仪表盘',
          },
          {
            path: '/login',
            title: '登录',
          },
        ],
        itemRender
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {/* 登录卡片容器 */}
        <Card title="审核员登录" style={{ width: 400 }}>
          {/* 登录表单 */}
          <Form layout="vertical" onFinish={onFinish}>
            {/* 密码输入字段 */}
            <Form.Item
              label="审核员密码"
              name="key"
              rules={[{ required: true, message: '请输入审核员密码' }]}
            >
              <Input placeholder="请输入您的密码" />
            </Form.Item>
            {/* 登录提交按钮 */}
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form>
        </Card>
      </div>
    </PageContainer>
  );
}
