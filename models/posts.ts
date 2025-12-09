// models/posts.ts
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  type: { type: String, default: 'draft' },
  timestamp: { type: Number, default: Date.now },
  cid: { type: String },
  sender: {
    source: { type: String, default: null },
    platform: { type: [String], default: [] }
  },
  content: {
    title: { type: String, default: '' },
    text: { type: String, default: '' },
    images: { type: [String], default: [] }
  },
  results: { type: Object }
}, {
  timestamps: true,
  versionKey: false
});

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

export default Post;
