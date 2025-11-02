// app/api/auth/[...nextauth]/route.ts
import { NextRequest } from "next/server"
import { handlers } from "@/lib/auth"
import dbConnect from '@/lib/db'

// 导出处理器
export async function GET(request: NextRequest) {
  await dbConnect();
  return handlers.GET(request);
}
export async function POST(request: NextRequest) {
  await dbConnect();
  return handlers.POST(request);
}