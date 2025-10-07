// models/drafts.ts
import mongoose from 'mongoose';

const draftSchema = new mongoose.Schema({
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
  review: {
    approve: { type: [Object], default: [] },
    reject: { type: [Object], default: [] },
    comments: { type: [Object], default: [] },
    stat : {
      approve: { type: Number, default: 0 },
      reject: { type: Number, default: 0 },
    }
  },
  num: { type: Number, default: 0 },
  images: { type: [String], default: [] }
}, {
  timestamps: true,
  versionKey: false
});

const Draft = mongoose.models.Draft || mongoose.model('Draft', draftSchema);

export default Draft;
