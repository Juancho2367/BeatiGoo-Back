import { Type, Static } from '@sinclair/typebox';

export const BusinessStatusSchema = Type.Union([
  Type.Literal('active'),
  Type.Literal('inactive'),
  Type.Literal('pending')
], { default: 'pending' });

export const BusinessSchema = Type.Object({
  _id: Type.Optional(Type.String()),
  name: Type.String({ minLength: 2 }),
  description: Type.String(),
  address: Type.String(),
  location: Type.Object({
    type: Type.Literal('Point'),
    coordinates: Type.Tuple([Type.Number(), Type.Number()]) // [longitude, latitude]
  }),
  category: Type.String(),
  ownerId: Type.String(),
  contact: Type.Object({
    phone: Type.String(),
    email: Type.String({ format: 'email' })
  }),
  operatingHours: Type.Array(Type.Object({
    day: Type.Number({ minimum: 0, maximum: 6 }), // 0 = Sunday, 6 = Saturday
    open: Type.String({ pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' }), // HH:mm format
    close: Type.String({ pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' })
  })),
  status: BusinessStatusSchema,
  rating: Type.Number({ minimum: 0, maximum: 5, default: 0 }),
  reviewCount: Type.Number({ minimum: 0, default: 0 }),
  images: Type.Array(Type.String()),
  amenities: Type.Array(Type.String()),
  socialMedia: Type.Object({
    website: Type.Optional(Type.String()),
    facebook: Type.Optional(Type.String()),
    instagram: Type.Optional(Type.String()),
    twitter: Type.Optional(Type.String())
  }),
  paymentMethods: Type.Array(Type.String()),
  cancellationPolicy: Type.Optional(Type.String()),
  minimumNotice: Type.Optional(Type.Number()), // in minutes
  maximumAdvanceBooking: Type.Optional(Type.Number()), // in days
  createdAt: Type.Optional(Type.String({ format: 'date-time' })),
  updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
});

export const BusinessResponseSchema = BusinessSchema;

// Export types for TypeScript usage
export type BusinessStatus = Static<typeof BusinessStatusSchema>;
export type Business = Static<typeof BusinessSchema>;
export type BusinessResponse = Static<typeof BusinessResponseSchema>; 