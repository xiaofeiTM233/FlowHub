// models/posts.ts
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  type: { type: String },
  timestamp: { type: Number },
  sender: {
    platform: { type: [String], required: true }
  },
  content: {
    text: { type: String },
    images: { type: [String] }
  },
  results: { type: Object }
}, {
  timestamps: true,
  versionKey: false
});

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

export default Post;
