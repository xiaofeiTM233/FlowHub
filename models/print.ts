// models/print.ts
import mongoose from 'mongoose';

const printSchema = new mongoose.Schema({
  type: { type: String },
  timestamp: { type: Number },
  sender: { type: Object },
  content: { type: Object }
}, {
  timestamps: true,  // 自动管理 createdAt 和 updatedAt
  versionKey: false  // 移除 __v 字段
});

const Print = mongoose.models.Print || mongoose.model('Print', printSchema);

export default Print;