import { FastifyError } from 'fastify';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
  CreatePaymentRequest,
  CreatePaymentResponse,
  GetPaymentResponse,
  UpdatePaymentStatusRequest,
  UpdatePaymentStatusResponse,
  RefundPaymentRequest,
  RefundPaymentResponse
} from '../schemas/payment.schema';

export class PaymentError extends Error implements FastifyError {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.code = 'PAYMENT_SERVICE_ERROR';
  }
}

export class PaymentService {
  private payments: Map<string, Payment> = new Map();

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      // TODO: Implement actual payment processing with a payment gateway
      // This is a mock implementation
      const payment: Payment = {
        id: this.generatePaymentId(),
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        status: 'PENDING',
        method: request.method,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.payments.set(payment.id, payment);
      return payment;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new PaymentError(`Payment creation failed: ${message}`);
    }
  }

  async getPayment(id: string): Promise<GetPaymentResponse> {
    try {
      const payment = this.payments.get(id);
      if (!payment) {
        throw new PaymentError(`Payment not found: ${id}`, 404);
      }
      return payment;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new PaymentError(`Failed to get payment: ${message}`);
    }
  }

  async updatePaymentStatus(id: string, request: UpdatePaymentStatusRequest): Promise<UpdatePaymentStatusResponse> {
    try {
      const payment = await this.getPayment(id);
      
      // Validate status transition
      if (!this.isValidStatusTransition(payment.status, request.status)) {
        throw new PaymentError(`Invalid status transition from ${payment.status} to ${request.status}`);
      }

      const updatedPayment: Payment = {
        ...payment,
        status: request.status,
        updatedAt: new Date().toISOString()
      };

      this.payments.set(id, updatedPayment);
      return updatedPayment;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new PaymentError(`Failed to update payment status: ${message}`);
    }
  }

  async refundPayment(id: string, request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    try {
      const payment = await this.getPayment(id);

      // Validate if payment can be refunded
      if (payment.status !== 'COMPLETED') {
        throw new PaymentError(`Payment cannot be refunded in status: ${payment.status}`);
      }

      const refundedPayment: Payment = {
        ...payment,
        status: 'REFUNDED',
        updatedAt: new Date().toISOString()
      };

      this.payments.set(id, refundedPayment);
      return refundedPayment;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new PaymentError(`Failed to refund payment: ${message}`);
    }
  }

  private generatePaymentId(): string {
    return `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isValidStatusTransition(currentStatus: PaymentStatus, newStatus: PaymentStatus): boolean {
    const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      'PENDING': ['COMPLETED', 'FAILED', 'CANCELLED'],
      'COMPLETED': ['REFUNDED'],
      'FAILED': ['PENDING'],
      'REFUNDED': [],
      'CANCELLED': []
    };

    return validTransitions[currentStatus].includes(newStatus);
  }
}

export function createPaymentService(): PaymentService {
  return new PaymentService();
} 