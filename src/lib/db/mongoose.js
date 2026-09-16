// src/lib/db/mongoose.js

import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env')
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      tls: true,
      // Never skip certificate validation in production — that would leave the
      // database connection open to interception. Local dev on Windows often
      // cannot validate the Atlas chain, so it stays relaxed there only.
      // Set MONGODB_TLS_INSECURE=true to force the old behaviour if needed.
      tlsAllowInvalidCertificates:
        process.env.MONGODB_TLS_INSECURE === 'true' ||
        process.env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m)
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB