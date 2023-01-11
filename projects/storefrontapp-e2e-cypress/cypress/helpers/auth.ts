/*
 * SPDX-FileCopyrightText: 2022 SAP Spartacus team <spartacus-team@sap.com>
 * SPDX-FileCopyrightText: 2023 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

//TODO: use this const in each place that storage key is used as string
export const AUTH_STORAGE_KEY = 'spartacus⚿⚿auth';

export function getStateAuth() {
  return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
}
