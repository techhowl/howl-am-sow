// src/scripts/create-admin.js
// Create a custom admin account.
// Usage: node src/scripts/create-admin.js "you@howl.in" "YourPassword" "Your Name"
//   email and password are required; name defaults to "Admin".

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from project root (this project keeps secrets in .env, not .env.local)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const [, , email, password, name = 'Admin'] = process.argv

if (!email || !password) {
  console.error('Usage: node src/scripts/create-admin.js "<email>" "<password>" "[name]"')
  process.exit(1)
}

if (password.length < 8) {
  console.error('❌ Password must be at least 8 characters.')
  process.exit(1)
}

async function createAdmin() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  // Inline schema — avoids @/ alias issue in scripts
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

  const existing = await User.findOne({ email })
  if (existing) {
    console.log(`User with email ${email} already exists. Skipping.`)
    await mongoose.disconnect()
    process.exit(0)
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await User.create({
    name,
    email,
    passwordHash,
    role: 'admin',
    isActive: true,
  })

  console.log('✅ Admin created successfully')
  console.log(`   Email: ${email}`)
  console.log(`   Role:  admin`)

  await mongoose.disconnect()
  process.exit(0)
}

createAdmin().catch((err) => {
  console.error('❌ Create failed:', err)
  process.exit(1)
})
