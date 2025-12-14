// app/menu.tsx
import {
  HomeOutlined,         // 首页
  FolderOpenOutlined,   // 帖子管理
  ProfileOutlined,      // 账号列表
  InboxOutlined,        // 帖子列表
  SignatureOutlined,    // 新建帖子
  AuditOutlined,        // 审核管理
  FileSearchOutlined,   // 帖子审核
  ControlOutlined,      // 系统管理
  TeamOutlined,         // 审核员
  SettingOutlined,      // 系统设置
  IdcardOutlined,       // 我的账号
  DashboardOutlined,    // 仪表盘
  LoginOutlined,        // 登录
} from '@ant-design/icons';

export const menuData = [
  {
    path: '/',
    name: '首页',
    icon: <HomeOutlined />,
  },
  {
    path: '/posts',
    name: '发帖管理',
    icon: <FolderOpenOutlined />,
    routes: [
      {
        path: '/posts/accounts',
        name: '账号列表',
        icon: <ProfileOutlined />,
      },
      {
        path: '/posts/list',
        name: '帖子列表',
        icon: <InboxOutlined />,
      },
      {
        path: '/posts/new',
        name: '新建帖子',
        icon: <SignatureOutlined />,
      },
    ],
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
    path: '/settings',
    name: '系统管理',
    icon: <ControlOutlined />,
    routes: [
      {
        path: '/settings/moderators',
        name: '审核员',
        icon: <TeamOutlined />,
      },
      {
        path: '/settings/options',
        name: '系统设置',
        icon: <SettingOutlined />,
      },
    ],
  },
  {
    path: '/dashboard',
    name: '我的账号',
    icon: <IdcardOutlined />,
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
