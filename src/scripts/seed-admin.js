// src/scripts/seed-admin.js

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env.local from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

async function seedAdmin() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  // Define schema inline — avoids @/ alias issue
  const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    role: String,
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    avatar: { type: String, default: null },
  }, { timestamps: true })

  const User = mongoose.models.User || mongoose.model('User', UserSchema)

  const existingAdmin = await User.findOne({ email: 'tech@howl.in' })

  if (existingAdmin) {
    console.log('Admin already exists. Skipping.')
    await mongoose.disconnect()
    process.exit(0)
  }

  const passwordHash = await bcrypt.hash('Howl@Admin2025', 10)

  await User.create({
    name: 'Howl Admin',
    email: 'tech@howl.in',
    passwordHash,
    role: 'admin',
    isActive: true,
  })

  console.log('✅ Admin created successfully')
  console.log('   Email:    tech@howl.in')
  console.log('   Password: Howl@Admin2025')
  console.log('   Change this password after first login.')

  await mongoose.disconnect()
  process.exit(0)
}

seedAdmin().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})