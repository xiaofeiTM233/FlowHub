// lib/auth.ts
import { NextRequest } from "next/server";
import NextAuth from "next-auth"
import { User } from "next-auth";
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Moderator from '@/models/moderators'
import type { IModerator } from '@/models/next-auth.d.ts'

// NextAuth 配置
const authConfig: NextAuthConfig = {
  // 认证提供商配置
  providers: [
    Credentials({
      name: 'KeyLogin',
      credentials: {
        key: { label: '管理员密码', type: 'text' },
      },
      // 认证逻辑
      async authorize(credentials) {
        const { key } = credentials as { key: string } || {};
        if (!key) {
          console.log('[Auth][Login] 凭据中未提供 key');
          return null;
        }
        // 验证 key 并获取用户信息
        const user = await checkKey(key);
        if (user) {
          console.log('[Auth][Login] 登录成功:', user);
        } else {
          console.log('[Auth][Login] 数据库中未找到匹配的 key');
        }
        return user;
      },
    })
  ],
  // 回调函数配置
  callbacks: {
    // JWT 回调
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.mid = user.mid;
        token.role = user.role;
      }
      return token;
    },
    // Session 回调
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.mid = token.mid as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  // 会话配置
  session: {
    strategy: 'jwt',
  },
  // JWT 密钥
  secret: process.env.AUTH_SECRET,
  // 页面配置
  pages: {
    signIn: '/dashboard/login',
  }
};

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);

async function checkKey(key: string): Promise<User | null> {
  if (!key) return null;
  try {
    // 在数据库中查找匹配的用户
    const moderator = await Moderator.findOne({ key }).lean<IModerator>();
    if (!moderator) {
      // 未找到匹配的用户
      return null;
    }
    // 返回用户对象
    return {
      id: moderator._id.toString(),
      mid: moderator.mid,
      role: moderator.role,
    };
  } catch (error) {
    console.error('[Auth][Check] 数据库查询失败:', error);
    return null;
  }
}

export async function authApi(request: NextRequest): Promise<User | null> {
  // 1. Session 认证
  const session = await auth();
  if (session?.user) {
    console.log('[Auth][Api] API 请求通过 Session 认证');
    return session.user as User;
  }
  // 2. API Key 认证
  const apiKey = request.headers.get('x-api-key') as string;
  if (apiKey) {
    const user = await checkKey(apiKey);
    if (user) {
      console.log('[Auth][Api] API 请求通过 API Key 认证');
      return user;
    }
  }
  // 3. 所有认证方式均失败
  console.log('[Auth][Api] API 请求认证失败');
  return null;
}
