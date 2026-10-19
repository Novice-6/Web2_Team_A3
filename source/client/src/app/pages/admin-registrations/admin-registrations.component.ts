import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { EventDetail, Registration } from '../../core/models';
import { FormatDatePipe } from '../../shared/format-date.pipe';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

@Component({
    selector: 'app-admin-registrations',
    imports: [RouterLink, FormatDatePipe],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './admin-registrations.component.html'
})
export class AdminRegistrationsComponent implements OnInit {
  eventId: string | null = null;
  event: EventDetail | null = null;
  registrations: Registration[] = [];

  state: LoadState = 'loading';
  errorMessage = '';

  constructor(
    private api: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.queryParamMap.get('id');

    if (!this.eventId) {
      this.state = 'error';
      this.errorMessage = 'No event specified.';
      return;
    }

    this.load();
  }

  private async load(): Promise<void> {
    if (!this.eventId) return;

    try {
      this.event = await this.api.getEvent(this.eventId);
      const registrations = await this.api.getEventRegistrations(this.eventId);
      this.registrations = registrations;
      this.state = registrations.length === 0 ? 'empty' : 'ready';
    } catch (error) {
      console.error('Failed to load registrations:', error);
      this.state = 'error';
    }
  }

  /** Masked views for the on-screen list (PII). The CSV export keeps full values. */
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

  /** Same CSV layout, quoting and filename as the original export. */
  async exportToCsv(): Promise<void> {
    if (!this.eventId) return;

    try {
      const registrations = await this.api.getEventRegistrations(this.eventId);
      const event = await this.api.getEvent(this.eventId);

      const headers = ['ID', 'Name', 'Email', 'Phone', 'Quantity', 'Registered At'];
      const rows = registrations.map(reg => [reg.id, reg.name, reg.email, reg.phone, reg.quantity, reg.registeredAt]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `registrations-${event.title.replace(/\s+/g, '-')}-${this.eventId}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export registrations.');
    }
  }
}
