import { FastifyError } from 'fastify';
import mongoose from 'mongoose';
import {
  Booking,
  BookingStatus,
  BookingPaymentStatus
} from '../schemas/booking.schema';
import { FastifyInstance } from 'fastify';

export class BookingError extends Error implements FastifyError {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.code = 'BOOKING_SERVICE_ERROR';
  }
}

const bookingSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  userId: { type: String, required: true },
  serviceId: { type: String, required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  price: { type: Number, required: true, min: 0 },
  notes: String,
  cancellationReason: String,
  refundAmount: Number,
  paymentId: String
}, {
  timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ businessId: 1, date: 1 });
bookingSchema.index({ userId: 1, date: 1 });
bookingSchema.index({ status: 1, date: 1 });

export class BookingService {
  private Booking: mongoose.Model<Booking>;

  constructor(private fastify: FastifyInstance) {
    this.Booking = fastify.mongoose.model<Booking>('Booking', bookingSchema);
  }

  async createBooking(bookingData: Omit<Booking, '_id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    try {
      // Check for conflicting bookings
      const conflicts = await this.findConflictingBookings(
        bookingData.businessId,
        new Date(bookingData.date),
        bookingData.duration
      );

      if (conflicts.length > 0) {
        throw new BookingError('There are conflicting bookings for this time slot');
      }

      const booking = new this.Booking(bookingData);
      return await booking.save();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BookingError(`Failed to create booking: ${message}`);
    }
  }

  async findBookingById(id: string): Promise<Booking> {
    try {
      const booking = await this.Booking.findById(id);
      if (!booking) {
        throw new BookingError(`Booking not found: ${id}`, 404);
      }
      return booking;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BookingError(`Failed to find booking: ${message}`);
    }
  }

  async findBookingsByUser(userId: string, options: {
    status?: BookingStatus[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
  } = {}): Promise<Booking[]> {
    try {
      const query: any = { userId };
      
      if (options.status) {
        query.status = { $in: options.status };
      }
      
      if (options.startDate || options.endDate) {
        query.date = {};
        if (options.startDate) query.date.$gte = options.startDate;
        if (options.endDate) query.date.$lte = options.endDate;
      }

      return await this.Booking.find(query)
        .sort({ date: 1 })
        .skip(options.skip || 0)
        .limit(options.limit || 50);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BookingError(`Failed to find user bookings: ${message}`);
    }
  }

  async findBookingsByBusiness(businessId: string, options: {
    status?: BookingStatus[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
  } = {}): Promise<Booking[]> {
    try {
      const query: any = { businessId };
      
      if (options.status) {
        query.status = { $in: options.status };
      }
      
      if (options.startDate || options.endDate) {
        query.date = {};
        if (options.startDate) query.date.$gte = options.startDate;
        if (options.endDate) query.date.$lte = options.endDate;
      }

      return await this.Booking.find(query)
        .sort({ date: 1 })
        .skip(options.skip || 0)
        .limit(options.limit || 50);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BookingError(`Failed to find business bookings: ${message}`);
    }
  }

  async updateBookingStatus(id: string, status: BookingStatus, notes?: string): Promise<Booking> {
    try {
      const booking = await this.findBookingById(id);
      
      // Validate status transition
      if (!this.isValidStatusTransition(booking.status, status)) {
        throw new BookingError(`Invalid status transition from ${booking.status} to ${status}`);
      }

      const updateData: any = { status };
      if (notes) updateData.notes = notes;

      const updatedBooking = await this.Booking.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (!updatedBooking) {
        throw new BookingError(`Failed to update booking status: ${id}`);
      }

      return updatedBooking;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BookingError(`Failed to update booking status: ${message}`);
    }
  }

  async updatePaymentStatus(id: string, paymentStatus: BookingPaymentStatus, paymentId?: string): Promise<Booking> {
    try {
      const booking = await this.findBookingById(id);
      
      // Validate payment status transition
      if (!this.isValidPaymentStatusTransition(booking.paymentStatus, paymentStatus)) {
        throw new BookingError(`Invalid payment status transition from ${booking.paymentStatus} to ${paymentStatus}`);
      }

      const updateData: any = { paymentStatus };
      if (paymentId) updateData.paymentId = paymentId;

      const updatedBooking = await this.Booking.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (!updatedBooking) {
        throw new BookingError(`Failed to update payment status: ${id}`);
      }

      return updatedBooking;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BookingError(`Failed to update payment status: ${message}`);
    }
  }

  async cancelBooking(id: string, reason: string): Promise<Booking> {
    try {
      const booking = await this.findBookingById(id);
      
      if (booking.status === 'cancelled') {
        throw new BookingError('Booking is already cancelled');
      }

      if (booking.status === 'completed') {
        throw new BookingError('Cannot cancel a completed booking');
      }

      const updatedBooking = await this.Booking.findByIdAndUpdate(
        id,
        { 
          status: 'cancelled',
          cancellationReason: reason,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedBooking) {
        throw new BookingError(`Failed to cancel booking: ${id}`);
      }

      return updatedBooking;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BookingError(`Failed to cancel booking: ${message}`);
    }
  }

  async findConflictingBookings(businessId: string, date: Date, duration: number): Promise<Booking[]> {
    try {
      const endDate = new Date(date.getTime() + duration * 60000); // Convert duration to milliseconds
      
      return await this.Booking.find({
        businessId,
        status: { $in: ['pending', 'confirmed'] },
        date: {
          $lt: endDate
        },
        $expr: {
          $gt: {
            $add: ['$date', { $multiply: ['$duration', 60000] }]
          },
          date
        }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BookingError(`Failed to find conflicting bookings: ${message}`);
    }
  }

  async findUpcomingBookings(userId: string, limit: number = 10): Promise<Booking[]> {
    try {
      return await this.Booking.find({
        userId,
        status: { $in: ['pending', 'confirmed'] },
        date: { $gt: new Date() }
      })
      .sort({ date: 1 })
      .limit(limit);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BookingError(`Failed to find upcoming bookings: ${message}`);
    }
  }

  async deleteBooking(id: string): Promise<boolean> {
    try {
      const booking = await this.findBookingById(id);
      
      if (booking.status === 'completed') {
        throw new BookingError('Cannot delete a completed booking');
      }

      const result = await this.Booking.deleteOne({ _id: id });
      return result.deletedCount === 1;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BookingError(`Failed to delete booking: ${message}`);
    }
  }

  private isValidStatusTransition(currentStatus: BookingStatus, newStatus: BookingStatus): boolean {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['completed', 'cancelled'],
      'cancelled': [],
      'completed': []
    };

    return validTransitions[currentStatus].includes(newStatus);
  }

  private isValidPaymentStatusTransition(currentStatus: BookingPaymentStatus, newStatus: BookingPaymentStatus): boolean {
    const validTransitions: Record<BookingPaymentStatus, BookingPaymentStatus[]> = {
      'pending': ['paid', 'failed'],
      'paid': ['refunded'],
      'refunded': [],
      'failed': ['pending']
    };

    return validTransitions[currentStatus].includes(newStatus);
  }
}

export function createBookingService(fastify: FastifyInstance): BookingService {
  return new BookingService(fastify);
} 