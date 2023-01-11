/*
 * SPDX-FileCopyrightText: 2022 SAP Spartacus team <spartacus-team@sap.com>
 * SPDX-FileCopyrightText: 2023 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Injectable } from '@angular/core';
import { CartModificationList } from '@spartacus/cart/base/root';
import { facadeFactory } from '@spartacus/core';
import { Observable } from 'rxjs';
import { ORDER_CORE_FEATURE } from '../feature-name';

@Injectable({
  providedIn: 'root',
  useFactory: () =>
    facadeFactory({
      facade: ReorderOrderFacade,
      feature: ORDER_CORE_FEATURE,
      methods: ['reorder'],
    }),
})
export abstract class ReorderOrderFacade {
  /**
   * Create a reorder
   */
  abstract reorder(
    orderId: string,
    userId: string
  ): Observable<CartModificationList>;
}
