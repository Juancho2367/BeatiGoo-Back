import { Type, Static } from '@sinclair/typebox';

export const GeoPointSchema = Type.Object({
  latitude: Type.Number(),
  longitude: Type.Number()
}, { additionalProperties: false });

export const GeocodingRequestSchema = Type.Object({
  address: Type.String()
}, { additionalProperties: false });

export const GeocodingResponseSchema = Type.Object({
  location: GeoPointSchema,
  formattedAddress: Type.String(),
  confidence: Type.Number()
}, { additionalProperties: false });

export const ReverseGeocodingRequestSchema = Type.Object({
  location: GeoPointSchema
}, { additionalProperties: false });

export const ReverseGeocodingResponseSchema = Type.Object({
  address: Type.String(),
  formattedAddress: Type.String(),
  components: Type.Object({
    street: Type.Optional(Type.String()),
    city: Type.Optional(Type.String()),
    state: Type.Optional(Type.String()),
    country: Type.Optional(Type.String()),
    postalCode: Type.Optional(Type.String())
  })
}, { additionalProperties: false });

export const DistanceRequestSchema = Type.Object({
  origin: GeoPointSchema,
  destination: GeoPointSchema
}, { additionalProperties: false });

export const DistanceResponseSchema = Type.Object({
  distance: Type.Number(),
  unit: Type.String()
}, { additionalProperties: false });

export const NearbySearchRequestSchema = Type.Object({
  center: GeoPointSchema,
  radius: Type.Number(),
  points: Type.Array(GeoPointSchema)
}, { additionalProperties: false });

export const NearbySearchResponseSchema = Type.Object({
  points: Type.Array(Type.Object({
    point: GeoPointSchema,
    distance: Type.Number()
  }))
}, { additionalProperties: false });

// Export types for TypeScript usage
export type GeoPoint = Static<typeof GeoPointSchema>;
export type GeocodingRequest = Static<typeof GeocodingRequestSchema>;
export type GeocodingResponse = Static<typeof GeocodingResponseSchema>;
export type ReverseGeocodingRequest = Static<typeof ReverseGeocodingRequestSchema>;
export type ReverseGeocodingResponse = Static<typeof ReverseGeocodingResponseSchema>;
export type DistanceRequest = Static<typeof DistanceRequestSchema>;
export type DistanceResponse = Static<typeof DistanceResponseSchema>;
export type NearbySearchRequest = Static<typeof NearbySearchRequestSchema>;
export type NearbySearchResponse = Static<typeof NearbySearchResponseSchema>; 