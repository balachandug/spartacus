/*
 * SPDX-FileCopyrightText: 2023 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  CostCenter,
  EntitiesModel,
  LoggerService,
  StateUtils,
  normalizeHttpError,
} from '@spartacus/core';
import { Observable, from, of } from 'rxjs';
import { catchError, groupBy, map, mergeMap, switchMap } from 'rxjs/operators';
import { CostCenterConnector } from '../../connectors/cost-center/cost-center.connector';
import { Budget } from '../../model/budget.model';
import {
  BudgetActions,
  CostCenterActions,
  OrganizationActions,
} from '../actions/index';

@Injectable()
export class CostCenterEffects {
  protected logger = inject(LoggerService);

  loadCostCenter$: Observable<
    | CostCenterActions.LoadCostCenterSuccess
    | CostCenterActions.LoadCostCenterFail
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(CostCenterActions.LOAD_COST_CENTER),
      map((action: CostCenterActions.LoadCostCenter) => action.payload),
      switchMap(({ userId, costCenterCode }) => {
        return this.costCenterConnector.get(userId, costCenterCode).pipe(
          map((costCenter: CostCenter) => {
            return new CostCenterActions.LoadCostCenterSuccess([costCenter]);
          }),
          catchError((error: HttpErrorResponse) =>
            of(
              new CostCenterActions.LoadCostCenterFail({
                costCenterCode,
                error: normalizeHttpError(error, this.logger),
              })
            )
          )
        );
      })
    )
  );

  loadCostCenters$: Observable<
    | CostCenterActions.LoadCostCentersSuccess
    | CostCenterActions.LoadCostCenterSuccess
    | CostCenterActions.LoadCostCentersFail
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(CostCenterActions.LOAD_COST_CENTERS),
      map((action: CostCenterActions.LoadCostCenters) => action.payload),
      switchMap((payload) =>
        this.costCenterConnector.getList(payload.userId, payload.params).pipe(
          switchMap((costCenters: EntitiesModel<CostCenter>) => {
            const { values, page } = StateUtils.normalizeListPage(
              costCenters,
              'code'
            );
            return [
              new CostCenterActions.LoadCostCenterSuccess(values),
              new CostCenterActions.LoadCostCentersSuccess({
                page,
                params: payload.params,
              }),
            ];
          }),
          catchError((error: HttpErrorResponse) =>
            of(
              new CostCenterActions.LoadCostCentersFail({
                params: payload.params,
                error: normalizeHttpError(error, this.logger),
              })
            )
          )
        )
      )
    )
  );

  createCostCenter$: Observable<
    | CostCenterActions.CreateCostCenterSuccess
    | CostCenterActions.CreateCostCenterFail
    | OrganizationActions.OrganizationClearData
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(CostCenterActions.CREATE_COST_CENTER),
      map((action: CostCenterActions.CreateCostCenter) => action.payload),
      switchMap((payload) =>
        this.costCenterConnector
          .create(payload.userId, payload.costCenter)
          .pipe(
            switchMap((data) => [
              new CostCenterActions.CreateCostCenterSuccess(data),
              new OrganizationActions.OrganizationClearData(),
            ]),
            catchError((error: HttpErrorResponse) =>
              from([
                new CostCenterActions.CreateCostCenterFail({
                  costCenterCode: payload.costCenter.code ?? '',
                  error: normalizeHttpError(error, this.logger),
                }),
                new OrganizationActions.OrganizationClearData(),
              ])
            )
          )
      )
    )
  );

  updateCostCenter$: Observable<
    | CostCenterActions.UpdateCostCenterSuccess
    | CostCenterActions.UpdateCostCenterFail
    | OrganizationActions.OrganizationClearData
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(CostCenterActions.UPDATE_COST_CENTER),
      map((action: CostCenterActions.UpdateCostCenter) => action.payload),
      switchMap((payload) =>
        this.costCenterConnector
          .update(payload.userId, payload.costCenterCode, payload.costCenter)
          .pipe(
            switchMap((data) => [
              new CostCenterActions.UpdateCostCenterSuccess(data),
              new OrganizationActions.OrganizationClearData(),
            ]),
            catchError((error: HttpErrorResponse) =>
              from([
                new CostCenterActions.UpdateCostCenterFail({
                  costCenterCode: payload.costCenter.code ?? '',
                  error: normalizeHttpError(error, this.logger),
                }),
                new OrganizationActions.OrganizationClearData(),
              ])
            )
          )
      )
    )
  );

  loadAssignedBudgets$: Observable<
    | CostCenterActions.LoadAssignedBudgetsSuccess
    | BudgetActions.LoadBudgetSuccess
    | CostCenterActions.LoadAssignedBudgetsFail
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(CostCenterActions.LOAD_ASSIGNED_BUDGETS),
      map((action: CostCenterActions.LoadAssignedBudgets) => action.payload),
      groupBy(({ costCenterCode, params }) =>
        StateUtils.serializeParams(costCenterCode, params)
      ),
      mergeMap((group) =>
        group.pipe(
          switchMap(({ userId, costCenterCode, params }) =>
            this.costCenterConnector
              .getBudgets(userId, costCenterCode, params)
              .pipe(
                switchMap((budgets: EntitiesModel<Budget>) => {
                  const { values, page } = StateUtils.normalizeListPage(
                    budgets,
                    'code'
                  );
                  return [
                    new BudgetActions.LoadBudgetSuccess(values),
                    new CostCenterActions.LoadAssignedBudgetsSuccess({
                      costCenterCode,
                      page,
                      params,
                    }),
                  ];
                }),
                catchError((error: HttpErrorResponse) =>
                  of(
                    new CostCenterActions.LoadAssignedBudgetsFail({
                      costCenterCode,
                      params,
                      error: normalizeHttpError(error, this.logger),
                    })
                  )
                )
              )
          )
        )
      )
    )
  );

  assignBudgetToCostCenter$: Observable<
    | CostCenterActions.AssignBudgetSuccess
    | CostCenterActions.AssignBudgetFail
    | OrganizationActions.OrganizationClearData
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(CostCenterActions.ASSIGN_BUDGET),
      map((action: CostCenterActions.AssignBudget) => action.payload),
      mergeMap(({ userId, costCenterCode, budgetCode }) =>
        this.costCenterConnector
          .assignBudget(userId, costCenterCode, budgetCode)
          .pipe(
            switchMap(() => [
              new CostCenterActions.AssignBudgetSuccess({
                code: budgetCode,
                selected: true,
              }),
              new OrganizationActions.OrganizationClearData(),
            ]),
            catchError((error: HttpErrorResponse) =>
              from([
                new CostCenterActions.AssignBudgetFail({
                  budgetCode,
                  error: normalizeHttpError(error, this.logger),
                }),
                new OrganizationActions.OrganizationClearData(),
              ])
            )
          )
      )
    )
  );

  unassignBudgetToCostCenter$: Observable<
    | CostCenterActions.UnassignBudgetSuccess
    | CostCenterActions.UnassignBudgetFail
    | OrganizationActions.OrganizationClearData
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(CostCenterActions.UNASSIGN_BUDGET),
      map((action: CostCenterActions.UnassignBudget) => action.payload),
      mergeMap(({ userId, costCenterCode, budgetCode }) =>
        this.costCenterConnector
          .unassignBudget(userId, costCenterCode, budgetCode)
          .pipe(
            switchMap(() => [
              new CostCenterActions.UnassignBudgetSuccess({
                code: budgetCode,
                selected: false,
              }),
              new OrganizationActions.OrganizationClearData(),
            ]),
            catchError((error: HttpErrorResponse) =>
              from([
                new CostCenterActions.UnassignBudgetFail({
                  budgetCode,
                  error: normalizeHttpError(error, this.logger),
                }),
                new OrganizationActions.OrganizationClearData(),
              ])
            )
          )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private costCenterConnector: CostCenterConnector
  ) {}
}
