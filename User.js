// User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  hashedPassword: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
