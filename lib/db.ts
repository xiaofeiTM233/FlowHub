// lib/db.ts
import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    '请在 .env.local 文件中定义 MONGODB_URI 环境变量'
  );
}

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var mongoose: MongooseCache;
}

// 将缓存初始化逻辑移到全局作用域
// 在开发环境中，热重载会清空模块级变量，但不会清空 `global` 对象
// 这可以防止在每次代码更改后都创建新的数据库连接
let cached: MongooseCache = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * 建立或返回一个缓存的 Mongoose 连接
 * @returns {Promise<Mongoose>} Mongoose 实例
 */
async function dbConnect(): Promise<Mongoose> {
  // 如果已有缓存的连接，直接返回
  if (cached.conn) {
    // console.log('🚀 使用已缓存的数据库连接');
    return cached.conn;
  }

  // 如果没有活动的连接 Promise，则创建一个新的
  if (!cached.promise) {
    const opts = {
      bufferCommands: true, 
    };

    // console.log('✨ 创建新的数据库连接');
    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongooseInstance) => {
      // 连接成功后，返回实例
      return mongooseInstance;
    });
  }

  try {
    // 等待连接 Promise 完成，并将连接实例存入缓存
    cached.conn = await cached.promise;
  } catch (e) {
    // 如果连接失败，清空缓存的 Promise 以便下次重试
    cached.promise = null;
    throw e;
  }

  // 返回成功的连接实例
  return cached.conn;
}

export default dbConnect;