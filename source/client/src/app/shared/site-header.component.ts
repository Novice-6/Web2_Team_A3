import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-site-header',
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <header class="header" [class.admin-header]="variant === 'admin'">
      <div class="container">
        <a [routerLink]="variant === 'admin' ? '/admin' : '/home'" class="brand">
          <img src="assets/logo.svg" alt="Green Tomorrow" width="32" height="32">
          <span>{{ variant === 'admin' ? 'Green Tomorrow Admin' : 'Green Tomorrow' }}</span>
        </a>
        <nav class="nav" [attr.aria-label]="variant === 'admin' ? 'Admin navigation' : 'Main navigation'">
          @if (variant === 'admin') {
            <a routerLink="/home">Public Site</a>
            <a routerLink="/admin" [attr.aria-current]="isActive('/admin') ? 'page' : null">Dashboard</a>
          } @else {
            <a routerLink="/home" [attr.aria-current]="isActive('/home') ? 'page' : null">Home</a>
            <a routerLink="/search" [attr.aria-current]="isActive('/search') ? 'page' : null">Events</a>
            <a routerLink="/admin">Admin</a>
          }
        </nav>
      </div>
    </header>
  `
})
export class SiteHeaderComponent {
  @Input() variant: 'public' | 'admin' = 'public';
  @Input() currentUrl = '/';

  isActive(path: string): boolean {
    return this.currentUrl === path || this.currentUrl.startsWith(path + '?');
  }
}
