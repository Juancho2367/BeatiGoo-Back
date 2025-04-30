import { FastifyError } from 'fastify';
import mongoose from 'mongoose';
import {
  Business,
  BusinessStatus
} from '../schemas/business.schema';
import { FastifyInstance } from 'fastify';

export class BusinessError extends Error implements FastifyError {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.code = 'BUSINESS_SERVICE_ERROR';
  }
}

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2 },
  description: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }
  },
  category: { type: String, required: true },
  ownerId: { type: String, required: true },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
  },
  operatingHours: [{
    day: { type: Number, required: true, min: 0, max: 6 },
    open: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    close: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ }
  }],
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  images: [String],
  amenities: [String],
  socialMedia: {
    website: String,
    facebook: String,
    instagram: String,
    twitter: String
  },
  paymentMethods: [String],
  cancellationPolicy: String,
  minimumNotice: Number, // in minutes
  maximumAdvanceBooking: Number // in days
}, {
  timestamps: true
});

// Indexes for better query performance
businessSchema.index({ location: '2dsphere' });
businessSchema.index({ category: 1 });
businessSchema.index({ ownerId: 1 });
businessSchema.index({ status: 1 });
businessSchema.index({ name: 'text', description: 'text' });

export class BusinessService {
  private Business: mongoose.Model<Business>;

  constructor(private fastify: FastifyInstance) {
    this.Business = fastify.mongoose.model<Business>('Business', businessSchema);
  }

  async createBusiness(businessData: Omit<Business, '_id' | 'createdAt' | 'updatedAt'>): Promise<Business> {
    try {
      // Validate operating hours
      this.validateOperatingHours(businessData.operatingHours);

      const business = new this.Business(businessData);
      return await business.save();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BusinessError(`Failed to create business: ${message}`);
    }
  }

  async findBusinessById(id: string): Promise<Business> {
    try {
      const business = await this.Business.findById(id);
      if (!business) {
        throw new BusinessError(`Business not found: ${id}`, 404);
      }
      return business;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BusinessError(`Failed to find business: ${message}`);
    }
  }

  async findBusinessesByOwner(ownerId: string, options: {
    status?: BusinessStatus[];
    limit?: number;
    skip?: number;
  } = {}): Promise<Business[]> {
    try {
      const query: any = { ownerId };
      
      if (options.status) {
        query.status = { $in: options.status };
      }

      return await this.Business.find(query)
        .sort({ createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 50);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BusinessError(`Failed to find owner's businesses: ${message}`);
    }
  }

  async findNearbyBusinesses(longitude: number, latitude: number, options: {
    maxDistance?: number;
    category?: string;
    status?: BusinessStatus[];
    limit?: number;
  } = {}): Promise<Business[]> {
    try {
      const query: any = {
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: options.maxDistance || 5000 // in meters
          }
        }
      };

      if (options.category) {
        query.category = options.category;
      }

      if (options.status) {
        query.status = { $in: options.status };
      }

      return await this.Business.find(query)
        .limit(options.limit || 50);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BusinessError(`Failed to find nearby businesses: ${message}`);
    }
  }

  async updateBusiness(id: string, businessData: Partial<Business>): Promise<Business> {
    try {
      const business = await this.findBusinessById(id);

      // Validate operating hours if they are being updated
      if (businessData.operatingHours) {
        this.validateOperatingHours(businessData.operatingHours);
      }

      const updatedBusiness = await this.Business.findByIdAndUpdate(
        id,
        businessData,
        { new: true }
      );

      if (!updatedBusiness) {
        throw new BusinessError(`Failed to update business: ${id}`);
      }

      return updatedBusiness;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BusinessError(`Failed to update business: ${message}`);
    }
  }

  async updateBusinessStatus(id: string, status: BusinessStatus): Promise<Business> {
    try {
      const business = await this.findBusinessById(id);
      
      // Validate status transition
      if (!this.isValidStatusTransition(business.status, status)) {
        throw new BusinessError(`Invalid status transition from ${business.status} to ${status}`);
      }

      const updatedBusiness = await this.Business.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!updatedBusiness) {
        throw new BusinessError(`Failed to update business status: ${id}`);
      }

      return updatedBusiness;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BusinessError(`Failed to update business status: ${message}`);
    }
  }

  async deleteBusiness(id: string): Promise<boolean> {
    try {
      const business = await this.findBusinessById(id);
      
      if (business.status === 'active') {
        throw new BusinessError('Cannot delete an active business');
      }

      const result = await this.Business.deleteOne({ _id: id });
      return result.deletedCount === 1;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BusinessError(`Failed to delete business: ${message}`);
    }
  }

  async searchBusinesses(query: string, options: {
    category?: string;
    status?: BusinessStatus[];
    location?: {
      longitude: number;
      latitude: number;
      maxDistance?: number;
    };
    limit?: number;
    skip?: number;
  } = {}): Promise<Business[]> {
    try {
      const searchCriteria: any = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      };

      if (options.category) {
        searchCriteria.category = options.category;
      }

      if (options.status) {
        searchCriteria.status = { $in: options.status };
      }

      if (options.location) {
        searchCriteria.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [options.location.longitude, options.location.latitude]
            },
            $maxDistance: options.location.maxDistance || 5000
          }
        };
      }

      return await this.Business.find(searchCriteria)
        .sort({ rating: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 50);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BusinessError(`Failed to search businesses: ${message}`);
    }
  }

  async updateBusinessRating(id: string, rating: number): Promise<Business> {
    try {
      const business = await this.findBusinessById(id);
      
      if (rating < 0 || rating > 5) {
        throw new BusinessError('Rating must be between 0 and 5');
      }

      const newReviewCount = business.reviewCount + 1;
      const newRating = ((business.rating * business.reviewCount) + rating) / newReviewCount;

      const updatedBusiness = await this.Business.findByIdAndUpdate(
        id,
        { 
          rating: newRating,
          reviewCount: newReviewCount
        },
        { new: true }
      );

      if (!updatedBusiness) {
        throw new BusinessError(`Failed to update business rating: ${id}`);
      }

      return updatedBusiness;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BusinessError(`Failed to update business rating: ${message}`);
    }
  }

  private validateOperatingHours(operatingHours: Business['operatingHours']): void {
    // Check for duplicate days
    const days = new Set(operatingHours.map(hour => hour.day));
    if (days.size !== operatingHours.length) {
      throw new BusinessError('Duplicate operating hours for the same day');
    }

    // Validate time format and ranges
    for (const hour of operatingHours) {
      const openTime = new Date(`2000-01-01T${hour.open}`);
      const closeTime = new Date(`2000-01-01T${hour.close}`);

      if (closeTime <= openTime) {
        throw new BusinessError(`Invalid operating hours: close time must be after open time for day ${hour.day}`);
      }
    }
  }

  private isValidStatusTransition(currentStatus: BusinessStatus, newStatus: BusinessStatus): boolean {
    const validTransitions: Record<BusinessStatus, BusinessStatus[]> = {
      'pending': ['active', 'inactive'],
      'active': ['inactive'],
      'inactive': ['active']
    };

    return validTransitions[currentStatus].includes(newStatus);
  }
}

export function createBusinessService(fastify: FastifyInstance): BusinessService {
  return new BusinessService(fastify);
} 