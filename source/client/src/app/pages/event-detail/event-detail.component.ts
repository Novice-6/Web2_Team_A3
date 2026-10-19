import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiError, ApiService } from '../../core/api.service';
import { EventDetail, WeatherForecast } from '../../core/models';
import { FormatDatePipe } from '../../shared/format-date.pipe';

type LoadState = 'loading' | 'ready' | 'error';

/** WMO weather interpretation codes returned by Open-Meteo. */
const WEATHER_LABELS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
};

/** Emoji glyph per WMO code group, for a compact forecast strip. */
function weatherIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 57) return '🌦️';
  if (code >= 61 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code >= 85 && code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌡️';
}

@Component({
    selector: 'app-event-detail',
    imports: [RouterLink, FormatDatePipe],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './event-detail.component.html'
})
export class EventDetailComponent implements OnInit {
  state: LoadState = 'loading';
  event: EventDetail | null = null;
  errorMessage = '';
  weather: WeatherForecast | null = null;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('id');

    if (!id) {
      this.state = 'error';
      this.errorMessage = 'No event specified. Please go back and select an event.';
      return;
    }

    this.load(id);
  }

  get statusLabel(): string {
    const status = this.event?.status ?? '';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  get canRegister(): boolean {
    return this.event?.status !== 'suspended';
  }

  maskName(name: string): string {
    if (!name || name.length <= 1) return name;
    return name[0] + '*'.repeat(Math.min(name.length - 1, 5));
  }

  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    return local[0] + '***@' + domain;
  }

  /** Compact forecast rows for the template (empty when weather is unavailable). */
  get forecastDays(): { date: string; icon: string; label: string; max: number; min: number }[] {
    const daily = this.weather?.daily;
    if (!daily || !daily.time || !daily.time.length) return [];
    return daily.time.map((date, index) => ({
      date,
      icon: weatherIcon(daily.weatherCode[index]),
      label: WEATHER_LABELS[daily.weatherCode[index]] || 'Unknown',
      max: daily.temperatureMax[index],
      min: daily.temperatureMin[index]
    }));
  }

  private async load(id: string): Promise<void> {
    try {
      this.event = await this.api.getEvent(id);
      this.state = 'ready';
      this.loadWeather(this.event.latitude, this.event.longitude);
    } catch (error) {
      console.error('Failed to load event:', error);
      this.state = 'error';
      this.errorMessage =
        error instanceof ApiError && error.status === 404
          ? 'Event not found. It may have been deleted.'
          : 'Failed to load event details. Please try again.';
    }
  }

  /** Weather is an optional enhancement: if it fails, the section simply stays hidden. */
  private async loadWeather(latitude?: number | null, longitude?: number | null): Promise<void> {
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      return;
    }

    try {
      this.weather = await this.api.getWeather(latitude, longitude);
    } catch (error) {
      console.warn('Weather unavailable for this event:', error);
      this.weather = null;
    }
  }
}
