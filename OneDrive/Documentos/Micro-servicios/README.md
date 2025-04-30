# Fastify Microservices Backend

A modern, type-safe microservices backend built with Fastify, TypeScript, and MongoDB.

## Features

- 🚀 Fast and lightweight Fastify framework
- 🔒 JWT Authentication
- 📝 OpenAPI/Swagger documentation
- 🔍 Type-safe with TypeScript
- 🗄️ MongoDB integration
- 🛡️ Security features (helmet, rate limiting, CORS)
- 🔄 Request validation with JSON Schema
- 📦 Modular plugin architecture
- 🎯 Clean architecture and best practices

## Prerequisites

- Node.js 18+
- MongoDB 5+
- TypeScript 5+

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fastify-microservices
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info
MONGODB_URI=mongodb://localhost:27017/fastify-microservices
JWT_SECRET=your-super-secret-key-change-this-in-production
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000
```

## Development

Start the development server:

```bash
npm run dev
```

## Build and Production

Build the project:

```bash
npm run build
```

Start in production:

```bash
npm start
```

## API Documentation

Once the server is running, you can access the Swagger documentation at:

```
http://localhost:3000/documentation
```

## API Endpoints

### Users

- `POST /api/v1/users/register` - Register a new user
- `POST /api/v1/users/login` - Login user
- `GET /api/v1/users/me` - Get user profile (authenticated)
- `PUT /api/v1/users/me` - Update user profile (authenticated)
- `DELETE /api/v1/users/me` - Delete user (authenticated)

## Project Structure

```
src/
  ├── config/        # Configuration files
  ├── plugins/       # Fastify plugins
  ├── routes/        # API routes
  │   └── v1/        # API version 1
  ├── schemas/       # JSON schemas and TypeScript types
  ├── services/      # Business logic
  ├── hooks/         # Fastify hooks
  ├── decorators/    # Fastify decorators
  ├── app.ts         # Application setup
  └── server.ts      # Server entry point
```

## Testing

Run the test suite:

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 