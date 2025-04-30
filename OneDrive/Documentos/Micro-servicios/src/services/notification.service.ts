import { FastifyError } from 'fastify';
import mongoose from 'mongoose';
import { FastifyInstance } from 'fastify';
import {
  Notification,
  NotificationType,
  NotificationPriority
} from '../schemas/notification.schema';

export class NotificationError extends Error implements FastifyError {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.code = 'NOTIFICATION_SERVICE_ERROR';
  }
}

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: {
    type: String,
    enum: ['booking', 'payment', 'system', 'promotion'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ type: 1 });

export class NotificationService {
  private Notification: mongoose.Model<Notification>;

  constructor(private fastify: FastifyInstance) {
    this.Notification = fastify.mongoose.model<Notification>('Notification', notificationSchema);
  }

  async createNotification(notificationData: Omit<Notification, '_id' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    try {
      const notification = new this.Notification(notificationData);
      return await notification.save();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new NotificationError(`Failed to create notification: ${message}`);
    }
  }

  async findNotificationById(id: string): Promise<Notification> {
    try {
      const notification = await this.Notification.findById(id);
      if (!notification) {
        throw new NotificationError(`Notification not found: ${id}`, 404);
      }
      return notification;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new NotificationError(`Failed to find notification: ${message}`);
    }
  }

  async findNotificationsByUser(userId: string, options: {
    read?: boolean;
    limit?: number;
    skip?: number;
  } = {}): Promise<Notification[]> {
    try {
      const query: any = { userId };
      
      if (options.read !== undefined) {
        query.read = options.read;
      }

      return await this.Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 50);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new NotificationError(`Failed to find user notifications: ${message}`);
    }
  }

  async markAsRead(id: string): Promise<Notification> {
    try {
      const notification = await this.findNotificationById(id);
      
      if (notification.read) {
        return notification;
      }

      const updatedNotification = await this.Notification.findByIdAndUpdate(
        id,
        { read: true },
        { new: true }
      );

      if (!updatedNotification) {
        throw new NotificationError(`Failed to mark notification as read: ${id}`);
      }

      return updatedNotification;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new NotificationError(`Failed to mark notification as read: ${message}`);
    }
  }

  async deleteNotification(id: string): Promise<boolean> {
    try {
      const notification = await this.findNotificationById(id);
      
      const result = await this.Notification.deleteOne({ _id: id });
      return result.deletedCount === 1;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new NotificationError(`Failed to delete notification: ${message}`);
    }
  }

  async createBookingNotification(
    userId: string,
    bookingId: string,
    businessId: string,
    message: string,
    priority: NotificationPriority = 'medium'
  ): Promise<Notification> {
    return await this.createNotification({
      userId,
      type: 'booking',
      title: 'Booking Update',
      message,
      read: false,
      data: {
        bookingId,
        businessId
      },
      priority
    });
  }

  async createPaymentNotification(
    userId: string,
    paymentId: string,
    message: string,
    priority: NotificationPriority = 'medium'
  ): Promise<Notification> {
    return await this.createNotification({
      userId,
      type: 'payment',
      title: 'Payment Update',
      message,
      read: false,
      data: {
        paymentId
      },
      priority
    });
  }

  async createSystemNotification(
    userId: string,
    message: string,
    priority: NotificationPriority = 'medium'
  ): Promise<Notification> {
    return await this.createNotification({
      userId,
      type: 'system',
      title: 'System Notification',
      message,
      read: false,
      priority
    });
  }

  async createPromotionNotification(
    userId: string,
    message: string,
    data: Record<string, any>,
    priority: NotificationPriority = 'low'
  ): Promise<Notification> {
    return await this.createNotification({
      userId,
      type: 'promotion',
      title: 'Special Offer',
      message,
      read: false,
      data,
      priority
    });
  }
}

export function createNotificationService(fastify: FastifyInstance): NotificationService {
  return new NotificationService(fastify);
} 