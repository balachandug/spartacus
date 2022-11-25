/*
 * SPDX-FileCopyrightText: 2022 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { NgModule } from '@angular/core';
import { BundleComponentsModule } from '@spartacus/cart/bundle/components';
import { BundleCoreModule } from '@spartacus/cart/bundle/core';
import { BundleOccModule } from '@spartacus/cart/bundle/occ';

@NgModule({
  imports: [BundleCoreModule, BundleOccModule, BundleComponentsModule],
})
export class BundleModule {}
