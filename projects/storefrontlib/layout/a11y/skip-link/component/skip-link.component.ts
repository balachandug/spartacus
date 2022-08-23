/*
 * SPDX-FileCopyrightText: 2022 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { SkipLink } from '../config/skip-link.config';
import { SkipLinkService } from '../service/skip-link.service';

@Component({
  selector: 'cx-skip-link',
  templateUrl: './skip-link.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkipLinkComponent {
  skipLinks$: Observable<SkipLink[]> = this.skipLinkService.getSkipLinks();

  constructor(private skipLinkService: SkipLinkService) {}

  scrollToTarget(skipLink: SkipLink): void {
    this.skipLinkService.scrollToTarget(skipLink);
  }
}
