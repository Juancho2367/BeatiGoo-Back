export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Place {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  [key: string]: any;
}

export interface NearbyPoint {
  point: GeoPoint;
  distance: number;
}

export interface BusinessWithDistance extends Place {
  distance: number;
}

export interface NearbyBusinessesResponse extends Place {
  distance?: number;
} 