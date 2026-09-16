// src/lib/auth/auth.js

import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/db/mongoose'
import User from '@/lib/db/models/User'

// How often a live session is re-checked against the database.
// Keeps role changes / deactivations effective within a minute without
// putting a query on every single request.
const REVALIDATE_AFTER_MS = 60 * 1000

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        await connectDB()

        // Trim as well as lowercase — pasted / autofilled emails often carry
        // leading or trailing whitespace, which otherwise fails the lookup.
        const email = String(credentials.email).toLowerCase().trim()

        const user = await User.findOne({
          email,
          isActive: true,
        }).lean()

        if (!user) {
          throw new Error('Invalid email or password')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          throw new Error('Invalid email or password')
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Fresh sign-in — seed the token from the verified user record.
      if (user) {
        token.id = user.id
        token.role = user.role
        token.avatar = user.avatar
        token.checkedAt = Date.now()
        return token
      }

      if (!token?.id) return token

      // Re-check against the database periodically (or on an explicit
      // session update) so role changes and deactivations take effect on a
      // live session instead of waiting for the JWT to expire.
      const isStale = !token.checkedAt || Date.now() - token.checkedAt > REVALIDATE_AFTER_MS
      if (!isStale && trigger !== 'update') return token

      try {
        await connectDB()
        const dbUser = await User.findById(token.id)
          .select('name role isActive avatar')
          .lean()

        // Deleted or deactivated → returning null makes next-auth clear the
        // session cookie, which signs the account out everywhere.
        if (!dbUser || !dbUser.isActive) return null

        token.name = dbUser.name
        token.role = dbUser.role
        token.avatar = dbUser.avatar ?? null
        token.checkedAt = Date.now()
      } catch (error) {
        // A database hiccup must not sign the whole company out — keep the
        // existing token and try again on the next request.
        console.error('jwt revalidation failed:', error)
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.avatar = token.avatar
      }
      return session
    },
  },
})
