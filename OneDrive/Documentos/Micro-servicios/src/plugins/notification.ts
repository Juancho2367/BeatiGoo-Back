import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { NotificationService, createNotificationService } from '../services/notification.service';
import {
  NotificationSchema,
  NotificationResponseSchema
} from '../schemas/notification.schema';
import { Static } from '@sinclair/typebox';

declare module 'fastify' {
  interface FastifyInstance {
    notificationService: NotificationService;
  }
}

const notificationPlugin: FastifyPluginAsync = async (fastify, options) => {
  // Register the notification service with Fastify instance
  const notificationService = createNotificationService(fastify);
  fastify.decorate('notificationService', notificationService);

  // Register routes
  fastify.post('/notifications', {
    schema: {
      body: NotificationSchema,
      response: {
        201: NotificationResponseSchema
      }
    },
    handler: async (request, reply) => {
      const notification = await notificationService.createNotification(request.body as Static<typeof NotificationSchema>);
      return reply.code(201).send(notification);
    }
  });

  fastify.get('/notifications/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: NotificationResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const notification = await notificationService.findNotificationById(id);
      return notification;
    }
  });

  fastify.get('/notifications/user/:userId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      querystring: {
        type: 'object',
        properties: {
          read: { type: 'boolean' },
          limit: { type: 'number', default: 50 },
          skip: { type: 'number', default: 0 }
        }
      },
      response: {
        200: Type.Array(NotificationResponseSchema)
      }
    },
    handler: async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const { read, limit, skip } = request.query as {
        read?: boolean;
        limit?: number;
        skip?: number;
      };

      const notifications = await notificationService.findNotificationsByUser(userId, {
        read,
        limit,
        skip
      });

      return notifications;
    }
  });

  fastify.patch('/notifications/:id/read', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: NotificationResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const notification = await notificationService.markAsRead(id);
      return notification;
    }
  });

  fastify.delete('/notifications/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        204: Type.Null()
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      await notificationService.deleteNotification(id);
      return reply.code(204).send();
    }
  });
};

export default fp(notificationPlugin, {
  name: 'notification-plugin',
  dependencies: ['db-plugin']
}); 