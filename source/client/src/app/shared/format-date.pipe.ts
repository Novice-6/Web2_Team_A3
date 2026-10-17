import { Pipe, PipeTransform } from '@angular/core';

/** Same output as the original formatDate(): en-AU short weekday + date. */
@Pipe({ name: 'formatDate', standalone: true })
export class FormatDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';

    return new Date(value).toLocaleDateString('en-AU', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
