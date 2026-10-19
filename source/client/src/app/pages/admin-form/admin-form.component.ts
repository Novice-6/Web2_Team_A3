import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { Category, EventPayload, EventStatus, Organisation, Registration } from '../../core/models';
import { FormatDatePipe } from '../../shared/format-date.pipe';

/** Image choices offered by the admin form: every E-* and O-* asset in the library. */
const IMAGE_OPTIONS = [
  { value: 'E-01.jpg', label: 'E-01 - Tree Planting' },
  { value: 'E-02.jpg', label: 'E-02 - River Cleanup' },
  { value: 'E-03.jpg', label: 'E-03 - Birdwatching' },
  { value: 'E-04.jpg', label: 'E-04' },
  { value: 'E-05.jpg', label: 'E-05 - Tree Planting' },
  { value: 'E-06.jpg', label: 'E-06' },
  { value: 'E-07.jpg', label: 'E-07' },
  { value: 'E-08.jpg', label: 'E-08' },
  { value: 'O-01.jpg', label: 'O-01 - Tide Pool' },
  { value: 'O-02.jpg', label: 'O-02' },
  { value: 'O-03.jpg', label: 'O-03' },
  { value: 'O-04.jpg', label: 'O-04 - Shoreline' },
  { value: 'O-05.jpg', label: 'O-05' },
  { value: 'O-06.jpg', label: 'O-06 - Garden' },
  { value: 'O-07.jpg', label: 'O-07' },
  { value: 'O-08.jpg', label: 'O-08 - Rocky Shore' }
];

type FieldName =
  | 'title'
  | 'categoryId'
  | 'charityId'
  | 'date'
  | 'location'
  | 'status'
  | 'price'
  | 'latitude'
  | 'longitude'
  | 'image'
  | 'description'
  | 'purpose';

@Component({
    selector: 'app-admin-form',
    imports: [FormsModule, RouterLink, FormatDatePipe],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './admin-form.component.html'
})
export class AdminFormComponent implements OnInit {
  categories: Category[] = [];
  organisations: Organisation[] = [];
  imageOptions = IMAGE_OPTIONS;

  eventId: string | null = null;
  isEdit = false;

  registrations: Registration[] = [];
  registrationsLoaded = false;

  model = {
    title: '',
    categoryId: '',
    charityId: '',
    date: '',
    location: '',
    status: 'upcoming' as EventStatus,
    price: '',
    latitude: '',
    longitude: '',
    image: '',
    description: '',
    purpose: ''
  };

  errors: Partial<Record<FieldName, string>> = {};

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.queryParamMap.get('id');
    this.isEdit = !!this.eventId;
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadCategories();
    await this.loadOrganisations();

    if (this.isEdit && this.eventId) {
      await this.loadEvent(this.eventId);
      await this.loadRegistrations(this.eventId);
    }
  }

  async onSubmit(): Promise<void> {
    this.errors = {};

    if (!this.validate()) {
      return;
    }

    const payload: EventPayload = {
      title: this.model.title.trim(),
      categoryId: parseInt(this.model.categoryId, 10),
      charityId: parseInt(this.model.charityId, 10),
      date: this.model.date,
      location: this.model.location.trim(),
      status: this.model.status,
      price: this.model.price.trim(),
      image: this.model.image,
      description: this.model.description.trim(),
      purpose: this.model.purpose.trim(),
      serviceType: null,
      latitude: String(this.model.latitude).trim() === '' ? null : Number(this.model.latitude),
      longitude: String(this.model.longitude).trim() === '' ? null : Number(this.model.longitude)
    };

    try {
      if (this.isEdit && this.eventId) {
        await this.api.updateEvent(this.eventId, payload);
        alert('Event updated successfully!');
      } else {
        await this.api.createEvent(payload);
        alert('Event created successfully!');
      }
      this.router.navigate(['/admin']);
    } catch (error) {
      console.error('Save failed:', error);
      alert(error instanceof Error && error.message ? error.message : 'Failed to save event. Please try again.');
    }
  }

  async onDelete(): Promise<void> {
    if (!confirm('Are you sure? This will delete the event and ALL its registrations.')) {
      return;
    }

    if (!this.eventId) return;

    try {
      await this.api.deleteEvent(this.eventId);
      alert('Event deleted.');
      this.router.navigate(['/admin']);
    } catch (error) {
      console.error('Delete failed:', error);
      const status = (error as { status?: number }).status;
      if (status === 409) {
        alert('Cannot delete: This event has existing registrations.');
      } else {
        alert('Failed to delete event.');
      }
    }
  }

  private async loadCategories(): Promise<void> {
    try {
      this.categories = await this.api.getCategories();
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  private async loadOrganisations(): Promise<void> {
    try {
      this.organisations = await this.api.getOrganisations();
    } catch (error) {
      console.error('Failed to load organisations:', error);
    }
  }

  private async loadEvent(id: string): Promise<void> {
    try {
      const event = await this.api.getAdminEvent(id);

      this.model.title = event.title || '';
      this.model.categoryId = event.categoryId ? String(event.categoryId) : '';
      this.model.charityId = event.organisationId ? String(event.organisationId) : '';
      this.model.date = event.date || '';
      this.model.location = event.location || '';
      this.model.status = event.status || 'upcoming';
      this.model.price = event.price || '';
      this.model.latitude = event.latitude != null ? String(event.latitude) : '';
      this.model.longitude = event.longitude != null ? String(event.longitude) : '';
      this.model.image = event.image || '';
      this.model.description = event.description || '';
      this.model.purpose = event.purpose || '';
    } catch (error) {
      console.error('Failed to load event:', error);
      alert('Failed to load event data.');
      this.router.navigate(['/admin']);
    }
  }

  /** Read-only list of registrations linked to the event being edited. */
  private async loadRegistrations(id: string): Promise<void> {
    try {
      this.registrations = await this.api.getEventRegistrations(id);
      this.registrationsLoaded = true;
    } catch (error) {
      console.error('Failed to load event registrations:', error);
      this.registrationsLoaded = false;
    }
  }

  /** Masked views for the embedded registrations table (PII). */
  maskName(name: string): string {
    if (!name || name.length <= 1) return name;
    return name[0] + '*'.repeat(Math.min(name.length - 1, 5));
  }

  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    return local[0] + '***@' + domain;
  }

  maskPhone(phone: string): string {
    if (!phone || phone.length <= 4) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(-2);
  }

  /** Mirrors the original validateForm() rules and messages field by field. */
  private validate(): boolean {
    const fields: { name: FieldName; value: string; required: boolean; min?: number; max?: number }[] = [
      { name: 'title', value: this.model.title, required: true, min: 2, max: 60 },
      { name: 'categoryId', value: this.model.categoryId, required: true },
      { name: 'charityId', value: this.model.charityId, required: true },
      { name: 'date', value: this.model.date, required: true },
      { name: 'location', value: this.model.location, required: true, min: 2, max: 60 },
      { name: 'status', value: this.model.status, required: true },
      { name: 'price', value: this.model.price, required: true },
      { name: 'latitude', value: this.model.latitude, required: true },
      { name: 'longitude', value: this.model.longitude, required: true },
      { name: 'image', value: this.model.image, required: true },
      { name: 'description', value: this.model.description, required: true, max: 500 },
      { name: 'purpose', value: this.model.purpose, required: true, max: 500 }
    ];

    let valid = true;

    for (const field of fields) {
      // Numeric inputs (latitude/longitude) hand back a number, not a string.
      const value = String(field.value ?? '').trim();

      if (field.required && value.length === 0) {
        this.errors[field.name] = 'This field is required';
        valid = false;
        continue;
      }
      if (field.min !== undefined && value.length < field.min) {
        this.errors[field.name] = `Must be at least ${field.min} characters`;
        valid = false;
        continue;
      }
      if (field.max !== undefined && value.length > field.max) {
        this.errors[field.name] = `Must be at most ${field.max} characters`;
        valid = false;
      }
    }

    // Coordinates are required (weather lookup depends on them) and must sit
    // inside valid ranges so the forecast can resolve for the event location.
    const lat = Number(this.model.latitude);
    const lon = Number(this.model.longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      this.errors.latitude = 'Latitude must be between -90 and 90';
      valid = false;
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      this.errors.longitude = 'Longitude must be between -180 and 180';
      valid = false;
    }

    return valid;
  }
}
