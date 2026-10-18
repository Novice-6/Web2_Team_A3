import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { EventSummary } from '../../core/models';
import { EventCardComponent } from '../../shared/event-card.component';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

interface StatNumbers {
  events: number;
  volunteers: number;
  trees: number;
  shoreline: number;
}

@Component({
    selector: 'app-home',
    imports: [RouterLink, EventCardComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {
  state: LoadState = 'loading';
  events: EventSummary[] = [];

  /** Counted-up figures shown in the stats band. */
  display: Record<keyof StatNumbers, string> = {
    events: '0',
    volunteers: '0',
    trees: '0',
    shoreline: '0'
  };

  private timer?: ReturnType<typeof setInterval>;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private async load(): Promise<void> {
    try {
      const events = await this.api.getFeaturedEvents();
      this.events = events;
      this.state = events.length ? 'ready' : 'empty';

      this.animateStats({
        // Simulated figures kept from the original homepage.
        events: events.length || 8,
        volunteers: 156,
        trees: 2840,
        shoreline: 12.5
      });
    } catch (error) {
      console.error('Failed to load events:', error);
      this.state = 'error';
    }
  }

  /** Counts up from 0 to each target over one second, as the original did. */
  private animateStats(targets: StatNumbers): void {
    const keys = Object.keys(targets) as Array<keyof StatNumbers>;
    const startedAt = Date.now();

    this.timer = setInterval(() => {
      const progress = Math.min((Date.now() - startedAt) / 1000, 1);

      keys.forEach(key => {
        const end = targets[key];
        const current = end * progress;
        this.display[key] = Number.isInteger(end) ? String(Math.round(current)) : current.toFixed(1);
      });

      if (progress >= 1) clearInterval(this.timer);
    }, 16);
  }
}
