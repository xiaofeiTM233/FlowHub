// lib/auth.ts

import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Moderator from '@/models/moderators'

/**
 * 定义管理员文档类型接口
 */
interface ModeratorDoc {
  _id: any;
  mid: string;
  role: string;
  key: string;
}

/**
 * NextAuth 认证配置选项
 * 配置管理员登录认证系统
 */
export const authOptions: NextAuthConfig = {
  // 配置认证提供商列表
  providers: [
    // 管理员密码登录提供商
    Credentials({
      name: 'KeyLogin',
      // 定义登录表单字段
      credentials: {
        key: { label: '管理员密码', type: 'text' },
      },
      /**
       * 认证逻辑处理函数
       * @param credentials 用户提供的认证凭据
       * @returns 认证成功返回用户对象，失败返回 null
       */
      async authorize(credentials): Promise<any> {
        // 解构获取用户提供的密码
        const { key } = credentials as { key: string } || {};
        // 验证是否提供了密码
        if (!key) {
          console.log('[Auth] 未提供密码');
          return null;
        }
        try {
          console.log(key);
          // 在数据库中查找匹配的管理员密码
          const moderator: any | null = await Moderator.findOne({ key });
          // 验证密码是否存在
          if (!moderator) {
            console.log(`[Auth] 未找到匹配的密码`);
            return null;
          }
          // 认证成功，构造用户信息对象
          const user = {
            id: moderator._id.toString(),
            mid: moderator.mid,
            role: moderator.role,
          };
          console.log('[Auth] 登录成功，用户信息：', user);
          return user as any; // 临时使用 any 类型，可根据需要细化类型定义
        } catch (error) {
          // 捕获并记录数据库查询过程中的错误
          console.error('[Auth] 数据库查询失败：', error);
          return null;
        }
      },
    })
  ],
  /**
   * 自定义回调函数配置
   * 用于处理 JWT 和 Session 数据
   */
  callbacks: {
    /**
     * JWT 回调函数
     * 在创建或更新 JWT 时被调用
     */
    async jwt({ token, user }) {
      // 登录时，将用户信息添加到 token 中
      if (user) {
        token.id = user.id;
        token.mid = (user as { mid: string }).mid;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    /**
     * Session 回调函数
     * 在创建或更新 Session 时被调用
     */
    async session({ session, token }) {
      // 将 token 中的信息添加到 session，使客户端和服务端都能访问
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).mid = token.mid as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  // 会话管理配置
  session: {
    strategy: 'jwt', // 使用 JWT 策略以支持更多自定义字段
  },
  // 认证密码，从环境变量中获取
  secret: process.env.AUTH_SECRET,
};
