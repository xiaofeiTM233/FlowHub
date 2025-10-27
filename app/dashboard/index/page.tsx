// app/dashboard/page.tsx
'use client';

import type { FC } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Card,
  Typography,
  Button,
  App,
  Skeleton,
  Row,
  Col,
  Avatar,
  Statistic,
  Descriptions,
} from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import {
  LogoutOutlined,
  UserOutlined,
  AreaChartOutlined,
  SettingOutlined,
  FileTextOutlined,
  MessageOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import itemRender from '@/components/itemRender';

const { Title, Text, Link: AntLink } = Typography;
const endfield = Math.random() < 0.01;

interface CustomSession {
  user: {
    name?: string | null;
    mid?: string | null;
    role?: string | null;
  };
}

/**
 * 欢迎与用户信息卡片
 */
const WelcomeCard: FC<{ session: CustomSession | null }> = ({ session }) => (
  <Card style={{ marginBottom: 24 }}>
    <Row align="middle" gutter={16}>
      <Col>
        <Avatar size={64} icon={<UserOutlined />} src={`http://q.qlogo.cn/headimg_dl?dst_uin=${session?.user?.mid || 10000}&spec=640&img_type=jpg`} />
      </Col>
      <Col>
      <Title level={3} style={{ margin: 0 }}>
        {endfield 
          ? `欢迎来到塔卫二，${session?.user?.name || '管理员'}`
          : `欢迎回来，${session?.user?.name || '管理员'}！`
        }
      </Title>
      <Text type="secondary">
        {endfield ? '该做出你的判断了。' : '不必怀疑，无需慌张'}
      </Text>
      </Col>
    </Row>
    <Descriptions
      bordered
      column={1}
      size="small"
      style={{ marginTop: 24 }}
    >
      <Descriptions.Item label="ID">
        {session?.user?.mid || 'N/A'}
      </Descriptions.Item>
      <Descriptions.Item label="权限组">
        {(() => {
          const roleMap: Record<string, string> = {
            'sysop': '系统管理员',
            'admin': '管理员',
            'moderator': '审核员'
          };
          return roleMap[session?.user?.role || ''] || session?.user?.role || 'N/A';
        })()}
      </Descriptions.Item>
    </Descriptions>
  </Card>
);

/**
 * 关键数据统计卡片
 * 待处理
 */
const QuickStatsCard: FC = () => (
  <Card title="数据概览" style={{ marginBottom: 24 }}>
    <Row gutter={[16, 16]}>
      <Col span={12}>
        <Statistic title="今日稿件" value={114} prefix={<UserOutlined />} />
      </Col>
      <Col span={12}>
        <Statistic title="总稿件" value={514} prefix={<AreaChartOutlined />} />
      </Col>
      <Col span={12}>
        <Statistic title="待处理稿件" value={1919} prefix={<MessageOutlined />} />
      </Col>
      <Col span={12}>
        <Statistic title="审核员" value={810} prefix={<TeamOutlined />} />
      </Col>
    </Row>
  </Card>
);

/**
 * 系统功能/快捷入口卡片
 */
const SystemFunctionsCard: FC = () => {
  const cardActionStyle: React.CSSProperties = {
    width: '33.33%',
    textAlign: 'center',
    padding: '24px 0',
  };

  return (
    <Card title="系统功能">
      <Card.Grid style={cardActionStyle}>
        <AntLink href="#">
          <UserOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
          用户管理
        </AntLink>
      </Card.Grid>
      <Card.Grid style={cardActionStyle}>
        <AntLink href="#">
          <FileTextOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
          内容审核
        </AntLink>
      </Card.Grid>
      <Card.Grid style={cardActionStyle}>
        <AntLink href="#">
          <AreaChartOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
          数据分析
        </AntLink>
      </Card.Grid>
      <Card.Grid style={cardActionStyle}>
        <AntLink href="#">
          <MessageOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
          消息中心
        </AntLink>
      </Card.Grid>
      <Card.Grid style={cardActionStyle}>
        <AntLink href="#">
          <SettingOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
          系统设置
        </AntLink>
      </Card.Grid>
      <Card.Grid style={cardActionStyle}>
        <AntLink 
          style={{ cursor: 'pointer' }}
          onClick={() => signOut({ callbackUrl: '/dashboard/login' })}
        >
          <LogoutOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
          退出登录
        </AntLink>
      </Card.Grid>
    </Card>
  );
};

/**
 * 仪表盘页面骨架屏
 * 布局与最终页面一致，提升加载体验
 */
const DashboardSkeleton: FC = () => (
  <div style={{ padding: '24px' }}>
      <Row gutter={24}>
        <Col xs={24} md={16}>
          <Skeleton active paragraph={{ rows: 4 }} />
          <br />
          <Skeleton active paragraph={{ rows: 6 }} />
        </Col>
        <Col xs={24} md={8}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Col>
    </Row>
  </div>
);

/**
 * 仪表盘页面组件
 * 管理员控制台主页，显示用户信息、数据概览和系统功能入口
 */
export default function DashboardPage() {
  const { message } = App.useApp();
  const router = useRouter();

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      message.warning('请先登录');
      router.push('/dashboard/login');
    },
  }) as { data: CustomSession | null; status: string };

  // 使用更贴合页面布局的骨架屏
  if (status === 'loading') {
    return <DashboardSkeleton />;
  }

  return (
    <PageContainer
      header={{
        title: '',
        breadcrumb: {
          items: [{ path: '/dashboard', title: '仪表盘' }],
          itemRender,
        },
      }}
      content={null} 
      token={{
        paddingInlinePageContainerContent: 24,
      }}
    >
      <Row gutter={24}>
        {/* 左侧主区域 */}
        <Col xs={24} md={16}>
          {/* 欢迎与用户信息 */}
          <WelcomeCard session={session} />
          {/* 系统功能 */}
          <SystemFunctionsCard />
        </Col>

        {/* 右侧边栏区域 */}
        <Col xs={24} md={8}>
          {/* 关键数据统计 */}
          <QuickStatsCard />
          {/* 更多模块待补充 */}
        </Col>
      </Row>
    </PageContainer>
  );
}
