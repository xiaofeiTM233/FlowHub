// config/menuConfig.ts
export interface MenuItem {
  id: string;
  title: string;
  href: string;
  type: 'link' | 'group' | 'button';
  children?: MenuItem[];
  action?: string;
}

export const menuConfig: MenuItem[] = [
  {
    id: 'home',
    title: '首页',
    href: '/',
    type: 'link'
  },
  {
    id: 'about',
    title: '关于我们',
    href: '#',
    type: 'group',
    children: [
      { id: 'about-company', title: '公司介绍', href: '/about', type: 'link' },
      { id: 'about-team', title: '团队成员', href: '/about/team', type: 'link' }
    ]
  },
  {
    id: 'contact',
    title: '联系我们',
    href: '/contact',
    type: 'link'
  },
  {
    id: 'dashboard',
    title: '仪表盘',
    href: '/dashboard',
    type: 'link'
  },
  {
    id: 'review',
    title: '审核',
    href: '/review',
    type: 'link'
  }
];

// 根据路径获取页面标题的工具函数
export const getPageTitle = (pathname: string): string => {
  // 查找匹配的菜单项
  for (const item of menuConfig) {
    if (item.type === 'link' && item.href === pathname) {
      return item.title;
    }
    
    if (item.type === 'group' && item.children) {
      for (const child of item.children) {
        if (child.href === pathname) {
          return child.title;
        }
      }
    }
  }
  
  // 默认返回 FlowHub
  return 'FlowHub';
};