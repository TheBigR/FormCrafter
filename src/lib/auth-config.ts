import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { sql } from './db';
import bcrypt from 'bcryptjs';

// Validate required environment variables
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID is not set in environment variables');
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_SECRET is not set in environment variables');
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set in environment variables');
}

if (!process.env.NEXTAUTH_URL) {
  throw new Error('NEXTAUTH_URL is not set in environment variables');
}

console.log('🔧 NextAuth Configuration:');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing');

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug mode
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists in our database
          const [existingUser] = await sql`
            SELECT id, email, name FROM users WHERE email = ${user.email}
          `;

          if (!existingUser) {
            // Create new user in our database
            const [newUser] = await sql`
              INSERT INTO users (email, name, password_hash, oauth_provider, oauth_id)
              VALUES (${user.email}, ${user.name}, '', 'google', ${profile?.sub})
              RETURNING id, email, name
            `;
            console.log('Created new user from Google OAuth:', newUser);
          } else {
            // Update existing user's OAuth info if needed
            await sql`
              UPDATE users 
              SET oauth_provider = 'google', oauth_id = ${profile?.sub}
              WHERE email = ${user.email}
            `;
          }
          return true;
        } catch (error) {
          console.error('Error during Google sign in:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          // Get user from our database
          const [user] = await sql`
            SELECT id, email, name FROM users WHERE email = ${session.user.email}
          `;
          
          if (user) {
            session.user.id = user.id;
            session.user.email = user.email;
            session.user.name = user.name;
          }
        } catch (error) {
          console.error('Error fetching user from database:', error);
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
