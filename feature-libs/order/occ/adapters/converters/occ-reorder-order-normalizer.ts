/*
 * SPDX-FileCopyrightText: 2022 SAP Spartacus team <spartacus-team@sap.com>
 * SPDX-FileCopyrightText: 2023 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Injectable } from '@angular/core';
import { CartModificationList } from '@spartacus/cart/base/root';
import { Converter, Occ } from '@spartacus/core';

@Injectable({ providedIn: 'root' })
export class OccReorderOrderNormalizer
  implements Converter<Occ.CartModificationList, CartModificationList>
{
  constructor() {}

  convert(source: Occ.CartModificationList, target?: CartModificationList) {
    if (target === undefined) {
      target = { ...(source as any) } as CartModificationList;
    }
    return target;
  }
}
