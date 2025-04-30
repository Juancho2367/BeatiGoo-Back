/**
 * Auth-related types for the authentication system
 * These types match the frontend auth store structure
 */

import { User as SchemaUser } from '../schemas/user.schema';
import { Types } from 'mongoose';

// Extend the User type to include MongoDB's _id field
export interface User extends Omit<SchemaUser, '_id'> {
  _id: Types.ObjectId | string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: 'admin' | 'professional' | 'client';
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
} 