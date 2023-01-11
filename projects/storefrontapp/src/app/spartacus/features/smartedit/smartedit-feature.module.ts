/*
 * SPDX-FileCopyrightText: 2022 SAP Spartacus team <spartacus-team@sap.com>
 * SPDX-FileCopyrightText: 2023 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { NgModule } from '@angular/core';
import { CmsConfig, provideConfig } from '@spartacus/core';
import {
  SmartEditRootModule,
  SMART_EDIT_FEATURE,
} from '@spartacus/smartedit/root';

@NgModule({
  imports: [SmartEditRootModule],
  providers: [
    provideConfig(<CmsConfig>{
      featureModules: {
        [SMART_EDIT_FEATURE]: {
          module: () =>
            import('@spartacus/smartedit').then((m) => m.SmartEditModule),
        },
      },
    }),
  ],
})
export class SmartEditFeatureModule {}
