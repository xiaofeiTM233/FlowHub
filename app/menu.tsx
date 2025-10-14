import React from 'react';
import {
  CrownOutlined,
  FileTextOutlined,
  SmileOutlined,
  TableOutlined,
} from '@ant-design/icons';

export const menuData = [
  {
    path: '/',
    name: '首页',
    icon: <SmileOutlined />,
  },
  {
    path: '/',
    name: '审核管理',
    icon: <TableOutlined />,
    routes: [
      {
        path: '/review',
        name: '帖子审核',
        icon: <FileTextOutlined />,
      }
    ],
  },
  {
    path: '/admin',
    name: '管理页',
    icon: <CrownOutlined />,
    routes: [
      {
        path: '/admin/sub-page',
        name: '二级管理页',
        icon: <SmileOutlined />,
      },
    ],
  },
];