// src/scripts/set-superadmin.js
// Promote an existing account to superadmin, or create a new superadmin account.
//
// Usage:
//   node src/scripts/set-superadmin.js "<email>" "[password]" "[name]"
//
//   - If the user does NOT exist, a password (min 8 chars) is required and the
//     account is created as superadmin.
//   - If the user DOES exist, they are promoted to superadmin and reactivated.
//     Passing a password also resets their password.
//
// Examples:
//   node src/scripts/set-superadmin.js "abhishek@howl.in" "StrongPass123" "Abhishek"
//   node src/scripts/set-superadmin.js "abhishek@howl.in"        # promote only

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// This project keeps secrets in .env (not .env.local)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const [, , rawEmail, password, rawName] = process.argv

function usage(msg) {
  if (msg) console.error(`\n${msg}`)
  console.error('\nUsage: node src/scripts/set-superadmin.js "<email>" "[password]" "[name]"')
  console.error('  password is required only when the account does not exist yet.\n')
  process.exit(1)
}

if (!rawEmail) usage('Email is required.')

const email = rawEmail.toLowerCase().trim()
if (!EMAIL_RE.test(email)) usage(`"${rawEmail}" is not a valid email address.`)

if (password !== undefined && password.length < 8) {
  usage('Password must be at least 8 characters.')
}

// Derive a readable default name from the email local-part: "abhishek" -> "Abhishek"
function nameFromEmail(addr) {
  return addr
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const name = (rawName && rawName.trim()) || nameFromEmail(email)

async function setSuperadmin() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found in .env')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    tls: true,
    // Local dev on Windows often can't validate the Atlas chain; never relax this in prod.
    tlsAllowInvalidCertificates: process.env.NODE_ENV !== 'production',
    serverSelectionTimeoutMS: 10000,
  })
  console.log('Connected to MongoDB')

  // Inline schema — avoids the @/ alias, which is not resolvable in plain node scripts
  const UserSchema = new mongoose.Schema(
    {
      name: String,
      email: { type: String, unique: true, lowercase: true, trim: true },
      passwordHash: String,
      role: String,
      isActive: { type: Boolean, default: true },
      createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
      avatar: { type: String, default: null },
    },
    { timestamps: true }
  )

  const User = mongoose.models.User || mongoose.model('User', UserSchema)

  const existing = await User.findOne({ email })

  if (existing) {
    const wasRole = existing.role
    existing.role = 'superadmin'
    existing.isActive = true
    if (password) {
      existing.passwordHash = await bcrypt.hash(password, 10)
    }
    await existing.save()

    console.log(`Promoted ${email} to superadmin (was: ${wasRole})`)
    if (password) console.log('   Password was reset to the value you supplied.')
  } else {
    if (!password) {
      console.error(`\nNo account exists for ${email}.`)
      usage('Pass a password (min 8 chars) to create the account.')
    }
    const passwordHash = await bcrypt.hash(password, 10)
    await User.create({
      name,
      email,
      passwordHash,
      role: 'superadmin',
      isActive: true,
    })
    console.log(`Superadmin created: ${email}`)
    console.log(`   Name: ${name}`)
  }

  await mongoose.disconnect()
  process.exit(0)
}

setSuperadmin().catch(async (err) => {
  console.error('set-superadmin failed:', err.message || err)
  try { await mongoose.disconnect() } catch {}
  process.exit(1)
})
