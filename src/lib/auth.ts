import { sql } from './db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export class AuthService {
  // Create a new user
  static async createUser(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    const [user] = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${data.email}, ${hashedPassword}, ${data.name})
      RETURNING id, email, name, created_at, updated_at
    `;
    
    return user;
  }

  // Authenticate user
  static async authenticateUser(email: string, password: string): Promise<User | null> {
    const [user] = await sql`
      SELECT id, email, name, password_hash, created_at, updated_at
      FROM users 
      WHERE email = ${email}
    `;
    
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  // Create a session
  static async createSession(userId: string): Promise<Session> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const [session] = await sql`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
      RETURNING *
    `;
    
    return session;
  }

  // Get user from session token
  static async getUserFromToken(token: string): Promise<User | null> {
    const [session] = await sql`
      SELECT s.*, u.id, u.email, u.name, u.created_at, u.updated_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
    `;
    
    if (!session) return null;
    
    return {
      id: session.id,
      email: session.email,
      name: session.name,
      created_at: session.created_at,
      updated_at: session.updated_at,
    };
  }

  // Delete session (logout)
  static async deleteSession(token: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM sessions WHERE token = ${token}
    `;
    return result.count > 0;
  }

  // Get current user from request
  static async getCurrentUser(request: NextRequest): Promise<User | null> {
    const token = request.cookies.get('session_token')?.value;
    if (!token) return null;
    
    return await this.getUserFromToken(token);
  }

  // Check if user has access to form
  static async hasFormAccess(userId: string, formId: string): Promise<boolean> {
    const [form] = await sql`
      SELECT privacy_level, creator_id, allowed_emails
      FROM forms 
      WHERE id = ${formId}
    `;
    
    if (!form) return false;
    
    // Public forms are accessible to everyone
    if (form.privacy_level === 'public') return true;
    
    // Creator can always access their forms
    if (form.creator_id === userId) return true;
    
    // Check if user email is in allowed list
    if (form.privacy_level === 'specific_emails' && form.allowed_emails) {
      const [user] = await sql`
        SELECT email FROM users WHERE id = ${userId}
      `;
      
      if (user && form.allowed_emails.includes(user.email)) {
        return true;
      }
    }
    
    return false;
  }
}
