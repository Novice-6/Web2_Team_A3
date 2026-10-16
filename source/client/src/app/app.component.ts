import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { GsapRevealDirective } from './shared/gsap-reveal.directive';
import { SiteFooterComponent } from './shared/site-footer.component';
import { SiteHeaderComponent } from './shared/site-header.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent, GsapRevealDirective],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './app.component.css'
})
export class AppComponent {
  /** Current route, used to switch the header/footer variant. */
  url = '/home';

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.url = event.urlAfterRedirects;
      });
  }

  /** Admin routes share the same shell but use the admin header/footer. */
  get variant(): 'public' | 'admin' {
    return this.url.startsWith('/admin') ? 'admin' : 'public';
  }
}
