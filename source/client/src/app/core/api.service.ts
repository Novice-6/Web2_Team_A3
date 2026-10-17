import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  Category,
  EventDetail,
  EventPayload,
  EventSummary,
  Organisation,
  Registration,
  RegistrationPayload,
  WeatherForecast
} from './models';

/** Query values accepted by the list endpoints. */
export type Query = Record<string, string | number | undefined | null>;

/** Mirrors the error contract of the original frontend: message + HTTP status + payload. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: unknown = null
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = '/api';

  constructor(private http: HttpClient) {}

  getCategories(): Promise<Category[]> {
    return this.get<Category[]>('/categories');
  }

  getOrganisations(): Promise<Organisation[]> {
    return this.get<Organisation[]>('/organisations');
  }

  getFeaturedEvents(): Promise<EventSummary[]> {
    return this.get<EventSummary[]>('/events/featured');
  }

  searchEvents(query: Query): Promise<EventSummary[]> {
    return this.get<EventSummary[]>('/events/search', query);
  }

  getEvent(id: number | string): Promise<EventDetail> {
    return this.get<EventDetail>(`/events/${id}`);
  }

  getEventRegistrations(id: number | string): Promise<Registration[]> {
    return this.get<Registration[]>(`/events/${id}/registrations`);
  }

  getWeather(latitude: number, longitude: number): Promise<WeatherForecast> {
    return this.get<WeatherForecast>('/weather', { latitude, longitude });
  }

  createRegistration(id: number | string, payload: RegistrationPayload): Promise<Registration> {
    return this.request<Registration>('POST', `/events/${id}/registrations`, payload);
  }

  getAdminEvents(query: Query): Promise<EventSummary[]> {
    return this.get<EventSummary[]>('/admin/events', query);
  }

  getAdminEvent(id: number | string): Promise<EventDetail> {
    return this.get<EventDetail>(`/admin/events/${id}`);
  }

  createEvent(payload: EventPayload): Promise<{ id: number }> {
    return this.request<{ id: number }>('POST', '/admin/events', payload);
  }

  updateEvent(id: number | string, payload: EventPayload): Promise<EventPayload & { id: number | string }> {
    return this.request<EventPayload & { id: number | string }>('PUT', `/admin/events/${id}`, payload);
  }

  deleteEvent(id: number | string): Promise<{ message: string }> {
    return this.request<{ message: string }>('DELETE', `/admin/events/${id}`);
  }

  private get<T>(path: string, query?: Query): Promise<T> {
    return this.request<T>('GET', path, undefined, query);
  }

  private async request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
    const options: { params: HttpParams; body?: unknown } = { params: this.toParams(query) };
    if (body !== undefined) options.body = body;

    try {
      return await firstValueFrom(this.http.request<T>(method, `${this.base}${path}`, options));
    } catch (error) {
      throw this.toApiError(error);
    }
  }

  /** Blank values are omitted so the API falls back to its defaults. */
  private toParams(query?: Query): HttpParams {
    let params = new HttpParams();
    if (!query) return params;

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  private toApiError(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new ApiError('Network error. Please check your connection.', 0, null);
      }
      const data = error.error as { message?: string } | null;
      return new ApiError(data?.message || 'Request failed', error.status, error.error ?? null);
    }

    return new ApiError('Request failed', 0, null);
  }
}
