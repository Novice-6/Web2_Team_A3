import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime } from 'rxjs';

import { ApiError, ApiService } from '../../core/api.service';
import { EventSummary } from '../../core/models';
import { FormatDatePipe } from '../../shared/format-date.pipe';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

@Component({
    selector: 'app-admin-list',
    imports: [FormsModule, RouterLink, FormatDatePipe],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './admin-list.component.html'
})
export class AdminListComponent implements OnInit, OnDestroy {
  events: EventSummary[] = [];
  status = '';
  search = '';
  state: LoadState = 'loading';

  /** The search box debounces at 300ms; the status select reloads at once. */
  private searchChanged = new Subject<void>();
  private subscriptions = new Subscription();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.subscriptions.add(this.searchChanged.pipe(debounceTime(300)).subscribe(() => this.loadEvents()));
    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onStatusChange(): void {
    this.loadEvents();
  }

  onSearchChange(): void {
    this.searchChanged.next();
  }

  async handleDelete(event: EventSummary): Promise<void> {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await this.api.deleteEvent(event.id);
      await this.loadEvents();
    } catch (error) {
      console.error('Delete failed:', error);
      if (error instanceof ApiError && error.status === 409) {
        alert('Cannot delete this event because it has existing registrations. Please view and manage registrations first.');
      } else {
        alert('Failed to delete event. Please try again.');
      }
    }
  }

  private async loadEvents(): Promise<void> {
    this.state = 'loading';

    try {
      const events = await this.api.getAdminEvents({ status: this.status, q: this.search });
      this.events = events;
      this.state = events.length === 0 ? 'empty' : 'ready';
    } catch (error) {
      console.error('Failed to load events:', error);
      this.state = 'error';
    }
  }
}
