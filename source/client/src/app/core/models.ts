/** Event lifecycle status as stored in the database. */
export type EventStatus = 'upcoming' | 'ongoing' | 'suspended';

/** Badge label derived from status + date. */
export type DateState = 'Past' | 'Upcoming' | 'Ongoing' | 'Suspended';

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Organisation {
  id: number;
  name: string;
  focus?: string;
  email?: string;
  city?: string;
}

export interface Registration {
  id: number;
  name: string;
  email: string;
  phone: string;
  quantity: number;
  registeredAt: string;
}

/** Shape returned by GET /api/events, /api/events/featured, /api/events/search, /api/admin/events */
export interface EventSummary {
  id: number;
  title: string;
  category: string;
  date: string;
  location: string;
  status: EventStatus;
  image: string;
  description: string;
  purpose?: string;
  price: string;
  serviceType?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  registrationCount?: number;
}

/** Shape returned by GET /api/events/:id and GET /api/admin/events/:id */
export interface EventDetail extends EventSummary {
  categoryId?: number;
  organisationId?: number;
  organisationName?: string;
  focus?: string;
  city?: string;
  organisation?: Organisation;
  registrations: Registration[];
}

/** Body for POST/PUT of an event (admin form). */
export interface EventPayload {
  title: string;
  categoryId: number;
  charityId?: number;
  date: string;
  location: string;
  status: EventStatus;
  price: string;
  image: string;
  description: string;
  purpose: string;
  serviceType?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** Shape returned by GET /api/weather (proxied Open-Meteo forecast). */
export interface WeatherForecast {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: {
    time: string[];
    weatherCode: number[];
    temperatureMax: number[];
    temperatureMin: number[];
  } | null;
}

/** Body for POST /api/events/:id/registrations */
export interface RegistrationPayload {
  name: string;
  email: string;
  phone: string;
  quantity: number;
}
