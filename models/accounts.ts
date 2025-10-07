// models/accounts.ts
import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  aid: { type: String, required: true, unique: true },
  auth: { type: Object },
  uid: { type: String, required: true },
  cookies: { type: Object, required: true },
  stats: { type: Object },
}, {
  timestamps: true,
  versionKey: false
});

const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);

export default Account;
