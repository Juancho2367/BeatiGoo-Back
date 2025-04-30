import { Type, Static } from '@sinclair/typebox';

export const BookingStatusSchema = Type.Union([
  Type.Literal('pending'),
  Type.Literal('confirmed'),
  Type.Literal('cancelled'),
  Type.Literal('completed')
], { default: 'pending' });

export const BookingPaymentStatusSchema = Type.Union([
  Type.Literal('pending'),
  Type.Literal('paid'),
  Type.Literal('refunded'),
  Type.Literal('failed')
], { default: 'pending' });

export const BookingSchema = Type.Object({
  _id: Type.Optional(Type.String()),
  businessId: Type.String(),
  userId: Type.String(),
  serviceId: Type.String(),
  date: Type.String({ format: 'date-time' }),
  duration: Type.Number({ minimum: 1 }), // Duration in minutes
  status: BookingStatusSchema,
  paymentStatus: BookingPaymentStatusSchema,
  price: Type.Number({ minimum: 0 }),
  notes: Type.Optional(Type.String()),
  cancellationReason: Type.Optional(Type.String()),
  refundAmount: Type.Optional(Type.Number()),
  paymentId: Type.Optional(Type.String()),
  createdAt: Type.Optional(Type.String({ format: 'date-time' })),
  updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
});

export const BookingResponseSchema = BookingSchema;

// Export types for TypeScript usage
export type BookingStatus = Static<typeof BookingStatusSchema>;
export type BookingPaymentStatus = Static<typeof BookingPaymentStatusSchema>;
export type Booking = Static<typeof BookingSchema>;
export type BookingResponse = Static<typeof BookingResponseSchema>; 