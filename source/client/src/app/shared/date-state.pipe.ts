import { Pipe, PipeTransform } from '@angular/core';

import { DateState, EventSummary } from '../core/models';
import { dateState } from './date-state';

@Pipe({ name: 'dateState', standalone: true })
export class DateStatePipe implements PipeTransform {
  transform(event: Pick<EventSummary, 'status' | 'date'> | null | undefined): DateState {
    return dateState(event);
  }
}
