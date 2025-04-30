import { Type, Static } from '@sinclair/typebox';

export const PaymentMethodSchema = Type.Object({
  type: Type.Union([
    Type.Literal('CREDIT_CARD'),
    Type.Literal('DEBIT_CARD'),
    Type.Literal('BANK_TRANSFER'),
    Type.Literal('CASH')
  ]),
  details: Type.Object({
    cardNumber: Type.Optional(Type.String()),
    cardHolder: Type.Optional(Type.String()),
    expiryDate: Type.Optional(Type.String()),
    cvv: Type.Optional(Type.String()),
    bankAccount: Type.Optional(Type.String()),
    bankName: Type.Optional(Type.String())
  })
}, { additionalProperties: false });

export const PaymentStatusSchema = Type.Union([
  Type.Literal('PENDING'),
  Type.Literal('COMPLETED'),
  Type.Literal('FAILED'),
  Type.Literal('REFUNDED'),
  Type.Literal('CANCELLED')
]);

export const PaymentSchema = Type.Object({
  id: Type.String(),
  amount: Type.Number(),
  currency: Type.String(),
  description: Type.String(),
  status: PaymentStatusSchema,
  method: PaymentMethodSchema,
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' })
}, { additionalProperties: false });

export const CreatePaymentRequestSchema = Type.Object({
  amount: Type.Number(),
  currency: Type.String(),
  description: Type.String(),
  method: PaymentMethodSchema
}, { additionalProperties: false });

export const CreatePaymentResponseSchema = PaymentSchema;

export const GetPaymentResponseSchema = PaymentSchema;

export const UpdatePaymentStatusRequestSchema = Type.Object({
  status: PaymentStatusSchema
}, { additionalProperties: false });

export const UpdatePaymentStatusResponseSchema = PaymentSchema;

export const RefundPaymentRequestSchema = Type.Object({
  reason: Type.String()
}, { additionalProperties: false });

export const RefundPaymentResponseSchema = PaymentSchema;

// Export types for TypeScript usage
export type PaymentMethod = Static<typeof PaymentMethodSchema>;
export type PaymentStatus = Static<typeof PaymentStatusSchema>;
export type Payment = Static<typeof PaymentSchema>;
export type CreatePaymentRequest = Static<typeof CreatePaymentRequestSchema>;
export type CreatePaymentResponse = Static<typeof CreatePaymentResponseSchema>;
export type GetPaymentResponse = Static<typeof GetPaymentResponseSchema>;
export type UpdatePaymentStatusRequest = Static<typeof UpdatePaymentStatusRequestSchema>;
export type UpdatePaymentStatusResponse = Static<typeof UpdatePaymentStatusResponseSchema>;
export type RefundPaymentRequest = Static<typeof RefundPaymentRequestSchema>;
export type RefundPaymentResponse = Static<typeof RefundPaymentResponseSchema>; 