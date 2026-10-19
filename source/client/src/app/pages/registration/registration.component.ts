import { Component, ElementRef, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiError, ApiService } from '../../core/api.service';
import { EventDetail } from '../../core/models';
import { FormatDatePipe } from '../../shared/format-date.pipe';

type LoadState = 'loading' | 'ready' | 'error';

interface RegistrationForm {
  name: string;
  email: string;
  phone: string;
  quantity: string;
}

@Component({
    selector: 'app-registration',
    imports: [FormsModule, RouterLink, FormatDatePipe],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './registration.component.html'
})
export class RegistrationComponent implements OnInit {
  @ViewChild('errorBox') errorBox?: ElementRef<HTMLElement>;

  state: LoadState = 'loading';
  summaryError = '';
  event: EventDetail | null = null;

  form: RegistrationForm = { name: '', email: '', phone: '', quantity: '' };
  errors: Record<string, string> = {};

  /** Ticket quantities offered by the dropdown; matches the 1–99 server rule. */
  readonly quantities: number[] = Array.from({ length: 99 }, (_, i) => i + 1);

  formHidden = false;
  success = false;
  successText = 'Thank you for registering. We will send you a confirmation email shortly.';
  errorMessage = '';

  private eventId: string | null = null;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.queryParamMap.get('id');

    if (!this.eventId) {
      this.state = 'error';
      this.summaryError = 'No event specified. Please go back and select an event.';
      this.formHidden = true;
      return;
    }

    this.load(this.eventId);
  }

  async submit(): Promise<void> {
    if (!this.validate() || !this.eventId) return;

    try {
      const result = await this.api.createRegistration(this.eventId, {
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        phone: this.form.phone.trim(),
        quantity: Number(this.form.quantity)
      });

      this.formHidden = true;
      this.success = true;
      this.successText =
        `Registration confirmed for ${result.quantity} ticket${result.quantity > 1 ? 's' : ''}. ` +
        'We will send you a confirmation email shortly.';
    } catch (error) {
      console.error('Registration failed:', error);
      let message = 'Registration failed. Please try again.';

      if (error instanceof ApiError) {
        if (error.status === 400) {
          message = error.message || 'Please check your information and try again.';
        } else if (error.status === 409) {
          message = 'This email is already registered for this event.';
        }
      }

      this.showError(message);
    }
  }

  private async load(id: string): Promise<void> {
    try {
      const event = await this.api.getEvent(id);
      this.event = event;
      this.state = 'ready';

      if (event.status === 'suspended') {
        this.showError('Registration is closed for this event.');
        this.formHidden = true;
      }
    } catch (error) {
      console.error('Failed to load event:', error);
      this.state = 'error';
      this.summaryError = 'Failed to load event. Please try again.';
      this.formHidden = true;
    }
  }

  /** Same rules and messages as the original validateForm() setup. */
  private validate(): boolean {
    const errors: Record<string, string> = {};
    const name = this.form.name.trim();
    const email = this.form.email.trim();
    const phone = this.form.phone.trim();

    if (!name) errors['name'] = 'This field is required';
    else if (name.length < 2) errors['name'] = 'Must be at least 2 characters';
    else if (name.length > 30) errors['name'] = 'Must be at most 30 characters';

    if (!email) errors['email'] = 'This field is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors['email'] = 'Please enter a valid email address';

    if (!phone) errors['phone'] = 'This field is required';
    else if (!/^[\d\s\-+()]{8,15}$/.test(phone)) errors['phone'] = 'Please enter a valid phone number';

    if (!this.form.quantity) errors['quantity'] = 'This field is required';
    else if (!(Number(this.form.quantity) >= 1 && Number(this.form.quantity) <= 99)) {
      errors['quantity'] = 'Must be between 1 and 99';
    }

    this.errors = errors;
    return Object.keys(errors).length === 0;
  }

  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorBox?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }
}
