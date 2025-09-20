// app/api/users/route.ts
import dbConnect from '@/lib/db';
import user from '@/models/user';

export async function GET() {
  await dbConnect();
  const users = await user.find();
  return Response.json(users);
}

export async function POST(request: Request) {
  await dbConnect();
  const { name, email } = await request.json();
  const theuser = new user({ name, email });
  await theuser.save();
  return Response.json({ message: '用户已创建', user: theuser }, { status: 201 });
}