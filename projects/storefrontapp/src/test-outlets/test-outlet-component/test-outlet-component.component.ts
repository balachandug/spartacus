/*
 * SPDX-FileCopyrightText: 2023 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Component } from '@angular/core';

@Component({
  selector: 'cx-test-outlet-component',
  templateUrl: './test-outlet-component.component.html',
})
export class TestOutletComponentComponent {
  testComponent = 'CMSParagraphComponent';
}
