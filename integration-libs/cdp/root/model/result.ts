/*
 * SPDX-FileCopyrightText: 2023 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { orders } from './order/orders';

export interface result {
  result: orders[];
  totalItem: number[];
}
