import { TicketDetails, TicketEvent } from '@spartacus/customer-ticketing/root';
import { Observable } from 'rxjs';

export abstract class CustomerTicketingAdapter {
  abstract getTicket(
    customerId: string,
    ticketId: string
  ): Observable<TicketDetails>;

  abstract createTicketEvent(
    customerId: string,
    ticketId: string,
    ticketEvent: TicketEvent
  ): Observable<TicketEvent>;
}
