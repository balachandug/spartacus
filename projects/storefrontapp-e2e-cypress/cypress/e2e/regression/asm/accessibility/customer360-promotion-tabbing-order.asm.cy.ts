/*
 * SPDX-FileCopyrightText: 2023 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { tabbingOrderConfig as config } from '../../../../helpers/accessibility/tabbing-order.config';
import {
  asmTabbingOrderForCustomer360CouponList
} from '../../../../helpers/accessibility/tabbing-order/asm';

describe('Tabbing order for ASM', () => {
  before(() => {
    cy.window().then((win) => win.sessionStorage.clear());
  });

  context('ASM', () => {
    it('should allow to navigate with tab key for customer360 coupon list (CXSPA-3906)', () => {
        asmTabbingOrderForCustomer360CouponList(config.asmCustomer360CouponList);
    });
  });
});
