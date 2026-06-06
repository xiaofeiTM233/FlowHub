// models/attachments.ts
import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['base64', 'vercel', 'r2', 'webdav'], default: 'base64' },
  src: { type: String, required: true },
  name: { type: String, required: true },
  format: { type: String, required: true },
  uploader: { type: String, default: '' },
  size: { type: Number, default: 0 }
}, {
  timestamps: true,
  versionKey: false
});

// 复合索引：按存储类型 + 上传时间排序
attachmentSchema.index({ type: 1, createdAt: -1 });
// 按上传来源查询
attachmentSchema.index({ uploader: 1 });

const Attachment = mongoose.models.Attachment || mongoose.model('Attachment', attachmentSchema);

export default Attachment;
