import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EventSummary } from '../core/models';
import { dateState } from './date-state';
import { FormatDatePipe } from './format-date.pipe';

@Component({
    selector: 'app-event-card',
    imports: [RouterLink, FormatDatePipe],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <article class="card event-card">
      <img [src]="'assets/' + event.image" [alt]="event.title" class="card-image" loading="lazy">
      <div class="card-body">
        <div class="card-header">
          <span [class]="'status-badge ' + statusClass">{{ statusLabel }}</span>
          @if (event.serviceType) {
            <span class="service-badge">{{ event.serviceType }}</span>
          }
        </div>
        <h3 class="card-title">{{ event.title }}</h3>
        <div class="card-meta">
          <span>📅 {{ event.date | formatDate }}</span>
          <span>📍 {{ event.location }}</span>
        </div>
        <p class="card-description">{{ event.description }}</p>
        <div class="card-footer">
          <span class="card-price">{{ event.price }}</span>
          <a [routerLink]="['/event']" [queryParams]="{ id: event.id }" class="btn btn-primary btn-sm">View Details</a>
        </div>
      </div>
    </article>
  `
})
export class EventCardComponent {
  @Input({ required: true }) event!: EventSummary;

  get statusLabel() {
    return dateState(this.event);
  }

  get statusClass() {
    return `status-${this.statusLabel.toLowerCase()}`;
  }
}
