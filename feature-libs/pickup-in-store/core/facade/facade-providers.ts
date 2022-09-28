/*
 * SPDX-FileCopyrightText: 2022 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Provider } from '@angular/core';
import {
  IntendedPickupLocationFacade,
  PickupLocationsSearchFacade,
  PickupOptionFacade,
} from '@spartacus/pickup-in-store/root';
import { IntendedPickupLocationService } from './intended-pickup-location.service';
import { PickupLocationsSearchService } from './pickup-locations-search.service';
import { PickupOptionService } from './pickup-option.service';

export const facadeProviders: Provider[] = [
  IntendedPickupLocationService,
  {
    provide: IntendedPickupLocationFacade,
    useExisting: IntendedPickupLocationService,
  },
  PickupLocationsSearchService,
  {
    provide: PickupLocationsSearchFacade,
    useExisting: PickupLocationsSearchService,
  },
  PickupOptionService,
  {
    provide: PickupOptionFacade,
    useExisting: PickupOptionService,
  },
];
