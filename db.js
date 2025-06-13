import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'; 
const dbName = 'snapkitty';

const client = new MongoClient(uri);

export default async function connectDB() {
  if (!client.topology || !client.topology.isConnected()) {
    console.log("🔗 Connecting to MongoDB at", uri);
    await client.connect();
    console.log("✅ MongoDB connected");
  }
  return client.db(dbName);
}
