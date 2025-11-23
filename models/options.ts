// models/options.ts
import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  description: { type: String, default: 'FlowHub 稿件' },
  default_platform: { type: [String], default: ['aid1', 'aid2'] },
  review_push_platform: { type: String, default: 'aid2' },
  review_push_group: { type: Number, default: 949370222 },
  review_push_direct: { type: Boolean, default: true },
  publish_direct: { type: Boolean, default: true },
  approve_num: { type: Number, default: 1 },
  reject_num: { type: Number, default: 1 },
  total_num: { type: Number, default: 0 },
  last_number: { type: Number, default: 0 }
}, {
  timestamps: true,
  versionKey: false
});

const Option = mongoose.models.Options || mongoose.model('Options', optionSchema);

export default Option;
