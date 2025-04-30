import { Type, Static } from '@sinclair/typebox';

export const UserStatusSchema = Type.Union([
  Type.Literal('active'),
  Type.Literal('inactive'),
  Type.Literal('pending')
], { default: 'pending' });

export const UserRoleSchema = Type.Union([
  Type.Literal('admin'),
  Type.Literal('professional'),
  Type.Literal('client')
], { default: 'client' });

export const UserPreferencesSchema = Type.Object({
  notifications: Type.Boolean({ default: true }),
  language: Type.String({ default: 'en' })
});

export const UserSchema = Type.Object({
  firstName: Type.String({ minLength: 2 }),
  lastName: Type.String({ minLength: 2 }),
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8 }),
  phone: Type.String({ pattern: '^\\+?[1-9]\\d{1,14}$' }),
  role: UserRoleSchema,
  status: UserStatusSchema,
  preferences: UserPreferencesSchema
});

export const UserLoginSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String()
});

export const UserResponseSchema = Type.Omit(UserSchema, ['password']);

export const AuthResponseSchema = Type.Object({
  user: UserResponseSchema,
  token: Type.String()
});

export const RegisterSchema = Type.Object({
  firstName: Type.String({ minLength: 2 }),
  lastName: Type.String({ minLength: 2 }),
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8 }),
  phone: Type.String({ pattern: '^\\+?[1-9]\\d{1,14}$' }),
  role: UserRoleSchema
});

// Export types for TypeScript usage
export type UserStatus = Static<typeof UserStatusSchema>;
export type UserRole = Static<typeof UserRoleSchema>;
export type UserPreferences = Static<typeof UserPreferencesSchema>;
export type User = Static<typeof UserSchema>;
export type UserLogin = Static<typeof UserLoginSchema>;
export type UserResponse = Static<typeof UserResponseSchema>;
export type AuthResponse = Static<typeof AuthResponseSchema>;
export type RegisterData = Static<typeof RegisterSchema>; 