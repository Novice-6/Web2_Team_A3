import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'search', loadComponent: () => import('./pages/search/search.component').then(m => m.SearchComponent) },
  { path: 'event', loadComponent: () => import('./pages/event-detail/event-detail.component').then(m => m.EventDetailComponent) },
  { path: 'register', loadComponent: () => import('./pages/registration/registration.component').then(m => m.RegistrationComponent) },
  { path: 'admin', loadComponent: () => import('./pages/admin-list/admin-list.component').then(m => m.AdminListComponent) },
  { path: 'admin/form', loadComponent: () => import('./pages/admin-form/admin-form.component').then(m => m.AdminFormComponent) },
  { path: 'admin/registrations', loadComponent: () => import('./pages/admin-registrations/admin-registrations.component').then(m => m.AdminRegistrationsComponent) },
  { path: '**', redirectTo: 'home' }
];
