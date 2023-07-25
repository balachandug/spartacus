/*
 * SPDX-FileCopyrightText: 2023 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  Customer360CouponList,
  Customer360Facade,
  Customer360Type,
} from '@spartacus/asm/customer-360/root';
import { UserIdService } from '@spartacus/core';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  combineLatest,
  of,
} from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ActiveCartFacade,
  CartVoucherFacade,
  MultiCartFacade,
} from '@spartacus/cart/base/root';
import { Customer360SectionContext } from '../customer-360-section-context.model';
import { CouponEntry } from './asm-customer-coupon.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cx-asm-customer-coupon',
  templateUrl: './asm-customer-coupon.component.html',
})
export class AsmCustomerCouponComponent implements OnInit, OnDestroy {
  showErrorAlert$ = new BehaviorSubject<boolean>(false);
  showErrorAlertForApplyAction$ = new BehaviorSubject<boolean>(false);
  currentCartId: string | undefined;
  userId: string;
  entries$: Observable<Array<CouponEntry>>;
  subscription = new Subscription();

  constructor(
    protected context: Customer360SectionContext<Customer360CouponList>,
    protected cartVoucherService: CartVoucherFacade,
    protected userIdService: UserIdService,
    protected multiCartFacade: MultiCartFacade,
    protected activeCartFacade: ActiveCartFacade,
    protected customer360Facade: Customer360Facade
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.userIdService.getUserId().subscribe((user) => {
        this.userId = user ?? '';
      })
    );
    this.subscription.add(
      this.activeCartFacade.requireLoadedCart().subscribe((cart) => {
        this.currentCartId = cart?.code;
      })
    );
    this.subscription.add(
      this.cartVoucherService.getAddVoucherResultError().subscribe((error) => {
        if (error) {
          this.refreshComponent();
          this.showErrorAlertForApplyAction$.next(true);
        }
      })
    );
    this.subscription.add(
      this.cartVoucherService
        .getDeleteVoucherResultError()
        .subscribe((error) => {
          if (error) {
            this.refreshComponent();
            this.showErrorAlertForApplyAction$.next(true);
          }
        })
    );
    this.showErrorAlert$.next(false);
    this.showErrorAlertForApplyAction$.next(false);
    this.fetchCoupons();
  }

  get errorAlert$(): Observable<boolean> {
    return this.showErrorAlert$.asObservable();
  }

  fetchCoupons() {
    this.entries$ = combineLatest([this.context.data$]).pipe(
      map(([data]) => {
        let entries: Array<CouponEntry> = [];
        data.coupons.forEach((coupon) => {
          entries.push({
            ...coupon,
            applied: coupon.applied,
            code: coupon.code,
            name: coupon.name,
          });
        });
        return entries;
      }),
      catchError(() => {
        this.showErrorAlert$.next(true);
        return of([]);
      })
    );
  }

  closeErrorAlert(): void {
    this.showErrorAlert$.next(false);
  }

  closeErrorAlertForApplyAction(): void {
    this.showErrorAlertForApplyAction$.next(false);
  }

  refreshComponent() {
    this.entries$ = this.customer360Facade
      .get360Data([
        {
          requestData: { type: Customer360Type.COUPON_LIST },
        },
      ])
      .pipe(
        map((response) => {
          console.log(response);
          const couponList = response?.value?.find(
            (item) => item.type === Customer360Type.COUPON_LIST
          ) as Customer360CouponList;
          const newEntries: Array<CouponEntry> = [];
          if (couponList.coupons) {
            couponList.coupons.forEach((coupon) => {
              newEntries.push({
                ...coupon,
                applied: coupon.applied,
                code: coupon.code,
                name: coupon.name,
              });
            });
          }
          return newEntries;
        }),
        catchError((error) => {
          console.log(error);
          this.showErrorAlert$.next(true);
          return of([]);
        })
      );
  }

  applyCouponToCustomer(entry: CouponEntry) {
    this.cartVoucherService.addVoucher(entry?.code, this.currentCartId);
    this.refreshActionButton(true, entry?.code);
  }

  removeCouponToCustomer(entry: CouponEntry) {
    this.cartVoucherService.removeVoucher(entry?.code, this.currentCartId);
    this.refreshActionButton(false, entry?.code);
  }

  refreshActionButton(state: boolean, voucherCode: string) {
    this.entries$ = this.entries$.pipe(
      map((entries) => {
        entries.forEach((item) => {
          if (item.code === voucherCode) {
            item.applied = state;
          }
        });
        return entries;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
