import { Injectable, OnDestroy } from '@angular/core';
import {
  DeleteUserAddressEvent,
  EventService,
  UpdateUserAddressEvent,
  UserAddressEvent,
} from '@spartacus/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CheckoutDeliveryAddressFacade } from '../facade/checkout-delivery-address.facade';
import {
  ClearCheckoutDeliveryAddressEvent,
  DeliveryAddressClearedEvent,
  DeliveryAddressSetEvent,
  ResetCheckoutQueryEvent,
  ResetDeliveryModesEvent,
} from './checkout.events';

@Injectable({
  providedIn: 'root',
})
export class CheckoutDeliveryAddressEventListener implements OnDestroy {
  protected subscriptions = new Subscription();

  constructor(
    protected checkoutDeliveryAddressFacade: CheckoutDeliveryAddressFacade,
    protected eventService: EventService
  ) {
    this.onUserAddressChange();
    this.onDeliveryAddressChange();
  }

  /**
   * Clears the checkout delivery info when an address in the address book is
   * changed ( updated, set as default or deleted )
   *
   * Listens for UpdateUserAddressEvent or DeleteUserAddressEvent
   */
  protected onUserAddressChange(): void {
    this.subscriptions.add(
      this.eventService
        .get(UserAddressEvent)
        .pipe(
          filter(
            (event) =>
              event instanceof UpdateUserAddressEvent ||
              event instanceof DeleteUserAddressEvent
          )
        )
        .subscribe(() => {
          // we want to LL the checkout (if not already loaded), in order to clear the checkout data that's potentially set on the back-end
          this.checkoutDeliveryAddressFacade.clearCheckoutDeliveryAddress();

          this.eventService.dispatch({}, ResetDeliveryModesEvent);
        })
    );
  }

  protected onDeliveryAddressChange(): void {
    this.subscriptions.add(
      this.eventService.get(DeliveryAddressSetEvent).subscribe(() => {
        this.eventService.dispatch({}, ResetDeliveryModesEvent);

        this.eventService.dispatch({}, ResetCheckoutQueryEvent);
      })
    );

    this.subscriptions.add(
      this.eventService
        .get(DeliveryAddressClearedEvent)
        .subscribe(() =>
          this.eventService.dispatch({}, ResetCheckoutQueryEvent)
        )
    );

    this.subscriptions.add(
      this.eventService
        .get(ClearCheckoutDeliveryAddressEvent)
        .subscribe(() =>
          this.checkoutDeliveryAddressFacade.clearCheckoutDeliveryAddress()
        )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
