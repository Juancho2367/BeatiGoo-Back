import { FastifyError } from 'fastify';
import mongoose from 'mongoose';
import { FastifyInstance } from 'fastify';
import {
  User,
  UserStatus,
  RegisterData,
  UserLogin
} from '../schemas/user.schema';
import crypto from 'crypto';

export class UserError extends Error implements FastifyError {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.code = 'USER_SERVICE_ERROR';
  }
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  role: {
    type: String,
    enum: ['admin', 'professional', 'client'],
    default: 'client'
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    language: { type: String, default: 'en' }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

export class UserService {
  private User: mongoose.Model<User>;

  constructor(private fastify: FastifyInstance) {
    this.User = fastify.mongoose.model<User>('User', userSchema);
  }

  private hashPassword(password: string): string {
    return crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
  }

  async register(userData: RegisterData): Promise<User> {
    try {
      // Check if user with this email already exists
      const existingUser = await this.findUserByEmail(userData.email);
      if (existingUser) {
        throw new UserError('User with this email already exists', 409);
      }

      // Hash the password before storing
      const hashedPassword = this.hashPassword(userData.password);
      
      // Create the user with default preferences and active status
      const userToCreate = {
        ...userData,
        password: hashedPassword,
        status: 'active',
        preferences: {
          notifications: true,
          language: 'en'
        }
      };
      
      const user = new this.User(userToCreate);
      return await user.save();
    } catch (error: unknown) {
      if (error instanceof UserError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new UserError(`Failed to register user: ${message}`);
    }
  }

  async login({ email, password }: UserLogin): Promise<User | null> {
    try {
      const hashedPassword = this.hashPassword(password);
      const user = await this.User.findOne({
        email,
        password: hashedPassword,
        status: 'active'
      });
      
      if (!user) {
        throw new UserError('Invalid credentials', 401);
      }
      
      return user;
    } catch (error: unknown) {
      if (error instanceof UserError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new UserError(`Login failed: ${message}`);
    }
  }

  async createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      // Hash the password before storing
      const hashedPassword = this.hashPassword(userData.password);
      
      const userToCreate = {
        ...userData,
        password: hashedPassword
      };
      
      const user = new this.User(userToCreate);
      return await user.save();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new UserError(`Failed to create user: ${message}`);
    }
  }

  async validateUser({ email, password }: UserLogin): Promise<User | null> {
    const hashedPassword = this.hashPassword(password);
    return await this.User.findOne({
      email,
      password: hashedPassword,
    });
  }

  async findUserById(id: string): Promise<User> {
    try {
      const user = await this.User.findById(id).select('-password');
      if (!user) {
        throw new UserError(`User not found: ${id}`, 404);
      }
      return user;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new UserError(`Failed to find user: ${message}`);
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.User.findOne({ email });
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    try {
      await this.findUserById(id);
      
      // If password is being updated, hash it
      if (userData.password) {
        userData.password = this.hashPassword(userData.password);
      }
      
      const updatedUser = await this.User.findByIdAndUpdate(
        id,
        userData,
        { new: true }
      ).select('-password');

      if (!updatedUser) {
        throw new UserError(`Failed to update user: ${id}`);
      }

      return updatedUser;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new UserError(`Failed to update user: ${message}`);
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const user = await this.findUserById(id);
      
      if (user.status === 'active') {
        // Instead of hard deleting, update the status to inactive
        await this.User.findByIdAndUpdate(id, { status: 'inactive' });
        return true;
      }

      const result = await this.User.deleteOne({ _id: id });
      return result.deletedCount === 1;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new UserError(`Failed to delete user: ${message}`);
    }
  }
}

export function createUserService(fastify: FastifyInstance): UserService {
  return new UserService(fastify);
}

export default UserService; 