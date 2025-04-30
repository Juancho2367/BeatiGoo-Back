import { Type, Static } from '@sinclair/typebox';

export const NotificationTypeSchema = Type.Union([
  Type.Literal('booking'),
  Type.Literal('payment'),
  Type.Literal('system'),
  Type.Literal('promotion')
]);

export const NotificationPrioritySchema = Type.Union([
  Type.Literal('low'),
  Type.Literal('medium'),
  Type.Literal('high')
]);

export const NotificationSchema = Type.Object({
  _id: Type.Optional(Type.String()),
  userId: Type.String(),
  type: NotificationTypeSchema,
  title: Type.String(),
  message: Type.String(),
  read: Type.Boolean({ default: false }),
  data: Type.Optional(Type.Record(Type.String(), Type.Any())),
  priority: NotificationPrioritySchema,
  createdAt: Type.Optional(Type.String({ format: 'date-time' })),
  updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
});

export const NotificationResponseSchema = NotificationSchema;

// Export types for TypeScript usage
export type NotificationType = Static<typeof NotificationTypeSchema>;
export type NotificationPriority = Static<typeof NotificationPrioritySchema>;
export type Notification = Static<typeof NotificationSchema>;
export type NotificationResponse = Static<typeof NotificationResponseSchema>; 