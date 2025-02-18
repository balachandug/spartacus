/*
 * SPDX-FileCopyrightText: 2023 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { I18nModule, provideDefaultConfig } from '@spartacus/core';
import { IconModule } from '@spartacus/storefront';
import { ConfiguratorAttributeCompositionConfig } from '../composition/configurator-attribute-composition.config';
import { ConfiguratorAttributeHeaderComponent } from './configurator-attribute-header.component';

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    I18nModule,
    IconModule,
    NgSelectModule,
  ],
  providers: [
    provideDefaultConfig(<ConfiguratorAttributeCompositionConfig>{
      productConfigurator: {
        assignment: {
          Header: ConfiguratorAttributeHeaderComponent,
        },
      },
    }),
  ],
  declarations: [ConfiguratorAttributeHeaderComponent],
  exports: [ConfiguratorAttributeHeaderComponent],
})
export class ConfiguratorAttributeHeaderModule {}
