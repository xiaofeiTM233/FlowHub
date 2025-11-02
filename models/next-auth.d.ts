// models/next-auth.d.ts
import type { DefaultSession, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

// Moderator 数据模型结构定义
export interface IModerator {
  _id: { toString: () => string };
  mid: string;
  role: string;
  key: string;
}

// 声明一个模块来扩展 NextAuth 的现有类型
declare module 'next-auth' {
  // 扩展 Session 接口，添加自定义用户字段
  interface Session {
    user: {
      id: string;
      mid: string;
      role: string;
    } & DefaultSession['user']; // 保留 `name`, `email`, `image` 等默认字段
  }

  // 扩展 User 接口，定义认证返回的用户结构
  interface User {
    id: string;
    mid: string;
    role: string;
  }
}

declare module 'next-auth/jwt' {
  // 扩展 JWT 接口，定义 token 数据结构
  interface JWT {
    id: string;
    mid: string;
    role: string;
  }
}