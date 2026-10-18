import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, Subscription, debounceTime } from 'rxjs';

import { ApiService } from '../../core/api.service';
import { Category, EventSummary } from '../../core/models';
import { EventCardComponent } from '../../shared/event-card.component';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

@Component({
    selector: 'app-search',
    imports: [FormsModule, EventCardComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './search.component.html'
})
export class SearchComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  filters = { q: '', status: '', category: '', open: false };

  state: LoadState = 'loading';
  events: EventSummary[] = [];
  title = 'All Events';
  countText = '';

  /** Selects and checkboxes reload after 300ms, the search box after 500ms. */
  private filterChanged = new Subject<void>();
  private queryChanged = new Subject<void>();
  private subscriptions = new Subscription();

  constructor(
    private api: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(this.filterChanged.pipe(debounceTime(300)).subscribe(() => this.loadEvents()));
    this.subscriptions.add(this.queryChanged.pipe(debounceTime(500)).subscribe(() => this.loadEvents()));

    this.init();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /** Categories first, so filters carried in the URL can select a real option. */
  private async init(): Promise<void> {
    await this.loadCategories();
    this.prefillFromParams();
    await this.loadEvents();
  }

  onFilterChange(): void {
    this.filterChanged.next();
  }

  onQueryChange(): void {
    this.queryChanged.next();
  }

  /** Reset every filter back to its default and re-run the search. */
  clearFilters(): void {
    this.filters = { q: '', status: '', category: '', open: false };
    this.loadEvents();
  }

  private async loadCategories(): Promise<void> {
    try {
      this.categories = await this.api.getCategories();
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  /** Restore filters carried in the URL (e.g. /search?category=Forest). */
  private prefillFromParams(): void {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('q')) this.filters.q = params.get('q')!;
    if (params.get('status')) this.filters.status = params.get('status')!;
    if (params.get('category')) this.filters.category = params.get('category')!;
  }

  private async loadEvents(): Promise<void> {
    this.state = 'loading';

    try {
      const events = await this.api.searchEvents({
        q: this.filters.q,
        status: this.filters.status,
        category: this.filters.category,
        open: this.filters.open ? 1 : undefined
      });

      this.events = events;

      if (events.length === 0) {
        this.state = 'empty';
        this.countText = '0 events';
      } else {
        this.state = 'ready';
        this.countText = `${events.length} event${events.length !== 1 ? 's' : ''}`;
      }

      let title = 'All Events';
      if (this.filters.category) title = `${this.filters.category} Events`;
      if (this.filters.status) title += ` (${this.filters.status})`;
      this.title = title;
    } catch (error) {
      console.error('Search failed:', error);
      this.state = 'error';
      this.countText = '';
    }
  }
}
