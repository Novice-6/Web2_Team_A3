import { DateState, EventSummary } from '../core/models';

/** Today's date in the browser's local timezone, as 'YYYY-MM-DD'. */
export function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Date-derived badge: suspended/ongoing keep their own state, every other
 * event is marked Past or Upcoming from its date.
 */
export function dateState(event: Pick<EventSummary, 'status' | 'date'> | null | undefined): DateState {
  if (!event) return 'Upcoming';
  if (event.status === 'suspended') return 'Suspended';
  if (event.status === 'ongoing') return 'Ongoing';

  return String(event.date).slice(0, 10) < localToday() ? 'Past' : 'Upcoming';
}
