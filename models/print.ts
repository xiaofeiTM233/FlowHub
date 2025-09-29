// models/print.ts
import mongoose from 'mongoose';

const printSchema = new mongoose.Schema({
  type: { type: String, default: 'render' },
  timestamp: { type: Number, default: Date.now },
  pid: { type: String },
  sender: {
    userid: { type: Number, default: 10000 },
    nickname: { type: String, default: '昵称' },
    nick: { type: Boolean, default: false },
    platform: { type: [String], default: (process.env.DEFAULT_PLATFORM || '').split(',') }
  },
  content: {
    userid: { type: Number, default: 10000 },
    nickname: { type: String, default: '昵称' },
    foot_left_hint: { type: String, default: '发表于 ' },
    foot_right_hint: { type: String, default: 'by 飞小RAN' },
    list: { type: Array, required: true }
  },
}, {
  timestamps: true,
  versionKey: false
});

const Print = mongoose.models.Print || mongoose.model('Print', printSchema);

export default Print;