// models/user.ts
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
}, {
  versionKey: false
});

const user = mongoose.models.user || mongoose.model('user', userSchema);

export default user;