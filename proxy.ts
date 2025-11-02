// proxy.ts
import { auth } from "@/lib/auth"

// 中间件主函数，检查用户认证状态
export default auth((req) => {
  // 检查用户是否已登录
  const isLoggedIn = !!req.auth;

  // 未登录且不在登录页时重定向到登录页
  if (!isLoggedIn && req.nextUrl.pathname !== "/dashboard/login") {
    const loginUrl = new URL("/dashboard/login", req.nextUrl.origin);
    return Response.redirect(loginUrl);
  }
});

// 中间件配置，指定需要认证的路径
export const config = {
  // 排除 API、静态文件等不需要认证的路径
  matcher: ['/((?!api|_next/static|_next/image|logo.svg|favicon.ico).*)'],
};