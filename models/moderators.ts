// models/moderators.ts
import mongoose from 'mongoose';

const moderatorSchema = new mongoose.Schema({
  mid: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  key: { type: String, required: true, unique: true }
}, {
  timestamps: true,
  versionKey: false
});

const Moderator = mongoose.models.Moderator || mongoose.model('Moderator', moderatorSchema);

export default Moderator;
