// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import type { NextRequest } from "next/server"
import { authOptions } from "@/lib/auth"
import dbConnect from '@/lib/db'

// 初始化 NextAuth
const handler = NextAuth(authOptions as NextAuthConfig)

// 导出处理器
export async function GET(request: Request) {
  await dbConnect()
  return handler.handlers.GET(request as unknown as NextRequest)
}

export async function POST(request: Request) {
  await dbConnect()
  return handler.handlers.POST(request as unknown as NextRequest)
}
