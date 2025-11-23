// models/posts.ts
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  type: { type: String, default: 'draft' },
  timestamp: { type: Number, default: Date.now },
  cid: { type: String },
  sender: {
    anonymous: { type: Boolean, default: false },
    platform: { type: [String], default: [] }
  },
  content: {
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
