// src/scripts/set-superadmin.js
// Promote (or create) the superadmin account: chetan.marathe@howl.in
// Usage: node src/scripts/set-superadmin.js "<password>"
//   password is required only if the user does not already exist.

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// This project keeps secrets in .env (not .env.local)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const SUPERADMIN_EMAIL = 'chetan.marathe@howl.in'
const [, , password] = process.argv

async function setSuperadmin() {
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

  const existing = await User.findOne({ email: SUPERADMIN_EMAIL })

  if (existing) {
    existing.role = 'superadmin'
    existing.isActive = true
    await existing.save()
    console.log(`✅ ${SUPERADMIN_EMAIL} promoted to superadmin`)
  } else {
    if (!password || password.length < 8) {
      console.error('❌ User does not exist. Pass a password (min 8 chars) to create it:')
      console.error('   node src/scripts/set-superadmin.js "<password>"')
      await mongoose.disconnect()
      process.exit(1)
    }
    const passwordHash = await bcrypt.hash(password, 10)
    await User.create({
      name: 'Chetan Marathe',
      email: SUPERADMIN_EMAIL,
      passwordHash,
      role: 'superadmin',
      isActive: true,
    })
    console.log(`✅ Superadmin created: ${SUPERADMIN_EMAIL}`)
  }

  await mongoose.disconnect()
  process.exit(0)
}

setSuperadmin().catch((err) => {
  console.error('❌ set-superadmin failed:', err)
  process.exit(1)
})
