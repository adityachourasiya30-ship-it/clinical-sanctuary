import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let _memServer = null;
let _retryTimeout = null;

const RETRY_DELAY_MS = 8000;

async function tryLocalMongo(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
}

async function startMemoryServer() {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  // Use version 6.0.12 – smaller download than 7.x
  _memServer = await MongoMemoryServer.create({ binary: { version: '6.0.12' } });
  const memUri = _memServer.getUri();
  await mongoose.connect(memUri);
  console.log(`✅ In-memory MongoDB ready → ${memUri}`);
}

export const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI || '';
  const uri = rawUri.trim().toLowerCase();

  // ── Attempt 1: use provided URI (Atlas or local) ───────────────────
  if (uri && uri !== 'memory' && uri !== 'mock') {
    try {
      console.log(`🔄 Connecting to MongoDB: ${process.env.MONGODB_URI}`);
      await tryLocalMongo(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected.');
      return;
    } catch (err) {
      console.warn(`⚠️  Could not reach ${process.env.MONGODB_URI}: ${err.message}`);
    }
  }

  // ── Attempt 2: local default ───────────────────────────────────────
  const defaultLocal = 'mongodb://127.0.0.1:27017/clinical_sanctuary';
  try {
    console.log('🔄 Trying local MongoDB at 127.0.0.1:27017 …');
    await tryLocalMongo(defaultLocal);
    console.log('✅ Connected to local MongoDB.');
    return;
  } catch (_) {
    console.warn('⚠️  Local MongoDB not running.');
  }

  // ── Attempt 3: In-memory server (requires binary download) ─────────
  console.log('🔄 Starting embedded in-memory MongoDB …');
  try {
    await startMemoryServer();
    return;
  } catch (memErr) {
    console.warn('⚠️  In-memory MongoDB failed:', memErr.message);
  }

  // ── All attempts failed ────────────────────────────────────────────
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ No MongoDB available. Exiting.');
    process.exit(1);
  }

  console.warn(
    '\n⚠️  Running WITHOUT a database. Data will NOT be persisted.\n' +
    '   Fix options:\n' +
    '   1. Install MongoDB: winget install MongoDB.Server --source winget\n' +
    '   2. Use MongoDB Atlas: set MONGODB_URI=mongodb+srv://... in server/.env\n' +
    '   3. Run:  net start MongoDB  (if already installed)\n'
  );

  // Retry in background every 8 s so the server auto-connects after MongoDB installs
  const retryConnect = async () => {
    if (mongoose.connection.readyState !== 0) return; // already connected
    try {
      await tryLocalMongo(defaultLocal);
      console.log('✅ MongoDB reconnected automatically!');
    } catch (_) {
      _retryTimeout = setTimeout(retryConnect, RETRY_DELAY_MS);
    }
  };
  _retryTimeout = setTimeout(retryConnect, RETRY_DELAY_MS);
};

export const disconnectDB = async () => {
  if (_retryTimeout) clearTimeout(_retryTimeout);
  try {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (_memServer) await _memServer.stop();
  } catch (err) {
    console.error('DB disconnect error:', err);
  }
};
