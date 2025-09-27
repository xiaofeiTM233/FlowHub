// models/posts.ts
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  type: { type: String, default: 'draft' },
  timestamp: { type: Number, default: Date.now },
  cid: { type: String },
  sender: {
    userid: { type: Number, default: 10000 },
    nickname: { type: String, default: '昵称' },
    nick: { type: Boolean, default: false },
    platform: { type: [String], default: (process.env.DEFAULT_PLATFORM || '').split(',') }
  },
  content: {
    text: { type: String, default: '' },
    images: { type: [String], default: [] }
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
  results: { type: Object }
}, {
  timestamps: true,
  versionKey: false
});

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

export default Post;
