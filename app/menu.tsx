// app/menu.tsx
import {
  HomeOutlined,       // 首页
  AuditOutlined,      // 审核管理
  FileSearchOutlined, // 帖子审核
  UserOutlined,       // 我的账号
  DashboardOutlined,  // 仪表盘
  LoginOutlined,      // 登录
} from '@ant-design/icons';

export const menuData = [
  {
    path: '/',
    name: '首页',
    icon: <HomeOutlined />,
  },
  {
    path: '/review',
    name: '审核管理',
    icon: <AuditOutlined />,
    routes: [
      {
        path: '/review',
        name: '帖子审核',
        icon: <FileSearchOutlined />,
      },
    ],
  },
  {
    path: '/dashboard',
    name: '我的账号',
    icon: <UserOutlined />,
    routes: [
      {
        path: '/dashboard/index',
        name: '仪表盘',
        icon: <DashboardOutlined />,
      },
      {
        path: '/dashboard/login',
        name: '登录',
        icon: <LoginOutlined />,
      },
    ],
  },
];
