import { FastifyInstance } from 'fastify';
import { GeolocationService, LocationSchema, NearbyPlacesSchema } from '../../services/geolocation.service';

export default async function geolocationRoutes(fastify: FastifyInstance) {
  const geolocationService = new GeolocationService(fastify);

  // Obtener detalles de un lugar
  fastify.get<{ Params: { placeId: string } }>(
    '/places/:placeId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['placeId'],
          properties: {
            placeId: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              formatted_address: { type: 'string' },
              geometry: {
                type: 'object',
                properties: {
                  location: {
                    type: 'object',
                    properties: {
                      lat: { type: 'number' },
                      lng: { type: 'number' }
                    }
                  }
                }
              },
              rating: { type: 'number' },
              opening_hours: {
                type: 'object',
                properties: {
                  open_now: { type: 'boolean' }
                }
              },
              photos: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    photo_reference: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const { placeId } = request.params;
      const placeDetails = await geolocationService.getPlaceDetails(placeId);
      return placeDetails;
    }
  );

  // Buscar lugares cercanos
  fastify.post<{ Body: { location: { lat: number; lng: number }; radius?: number; type?: string } }>(
    '/places/nearby',
    {
      schema: {
        body: NearbyPlacesSchema,
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                place_id: { type: 'string' },
                name: { type: 'string' },
                vicinity: { type: 'string' },
                geometry: {
                  type: 'object',
                  properties: {
                    location: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number' },
                        lng: { type: 'number' }
                      }
                    }
                  }
                },
                rating: { type: 'number' },
                types: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const places = await geolocationService.searchNearbyPlaces(request.body);
      return places;
    }
  );

  // Geocodificar una dirección
  fastify.get<{ Querystring: { address: string } }>(
    '/geocode',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['address'],
          properties: {
            address: { type: 'string' }
          }
        },
        response: {
          200: LocationSchema
        }
      }
    },
    async (request, reply) => {
      const { address } = request.query;
      const location = await geolocationService.geocodeAddress(address);
      return location;
    }
  );

  // Obtener direcciones
  fastify.get<{ Querystring: { origin: string; destination: string } }>(
    '/directions',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['origin', 'destination'],
          properties: {
            origin: { type: 'string' },
            destination: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              legs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    distance: {
                      type: 'object',
                      properties: {
                        text: { type: 'string' },
                        value: { type: 'number' }
                      }
                    },
                    duration: {
                      type: 'object',
                      properties: {
                        text: { type: 'string' },
                        value: { type: 'number' }
                      }
                    },
                    steps: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          distance: {
                            type: 'object',
                            properties: {
                              text: { type: 'string' },
                              value: { type: 'number' }
                            }
                          },
                          duration: {
                            type: 'object',
                            properties: {
                              text: { type: 'string' },
                              value: { type: 'number' }
                            }
                          },
                          html_instructions: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const { origin, destination } = request.query;
      const directions = await geolocationService.getDirections(origin, destination);
      return directions;
    }
  );
} 