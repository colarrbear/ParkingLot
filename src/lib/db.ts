// This file is for server-side database connections only
// Add a check to prevent loading in the browser
let mongoose: any;

// Only import mongoose on the server side
if (typeof window === 'undefined') {
  // We're on the server
  mongoose = require('mongoose');
} else {
  // We're on the client
  console.warn('Attempted to load Mongoose on client side');
}

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/parking_lot';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global as any;

if (typeof window === 'undefined') {
  if (!cached.mongoose) {
    cached.mongoose = { conn: null };
  }
}

/**
 * Connect to MongoDB using Mongoose - only runs on server
 */
async function dbConnect() {
  // Don't run on client side
  if (typeof window !== 'undefined') {
    console.warn('Attempted to connect to MongoDB from client side');
    return null;
  }

  if (cached.mongoose && cached.mongoose.conn) {
    return cached.mongoose.conn;
  }

  const opts = {
    bufferCommands: false,
  };

  cached.mongoose.conn = await mongoose.connect(MONGODB_URI, opts);
  
  return cached.mongoose.conn;
}

export default dbConnect; 