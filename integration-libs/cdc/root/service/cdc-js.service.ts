/*
 * SPDX-FileCopyrightText: 2023 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, OnDestroy, PLATFORM_ID } from '@angular/core';
import {
  AuthService,
  BaseSiteService,
  GlobalMessageService,
  GlobalMessageType,
  LanguageService,
  ScriptLoader,
  User,
  WindowRef,
} from '@spartacus/core';
import { UserProfileFacade, UserSignUp } from '@spartacus/user/profile/root';
import {
  combineLatest,
  Observable,
  of,
  ReplaySubject,
  Subscription,
  throwError,
} from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';
import { CdcConfig } from '../config/cdc-config';
import { CdcAuthFacade } from '../facade/cdc-auth.facade';

@Injectable({
  providedIn: 'root',
})
export class CdcJsService implements OnDestroy {
  protected loaded$ = new ReplaySubject<boolean>(1);
  protected errorLoading$ = new ReplaySubject<boolean>(1);
  protected subscription: Subscription = new Subscription();
  protected gigyaSDK: { [key: string]: any };

  constructor(
    protected cdcConfig: CdcConfig,
    protected baseSiteService: BaseSiteService,
    protected languageService: LanguageService,
    protected scriptLoader: ScriptLoader,
    protected winRef: WindowRef,
    protected cdcAuth: CdcAuthFacade,
    protected auth: AuthService,
    protected userProfileFacade: UserProfileFacade,
    @Inject(PLATFORM_ID) protected platform: any,
    protected globalMessageService: GlobalMessageService
  ) {}

  /**
   * Initialize CDC script
   */
  initialize(): void {
    this.loadCdcJavascript();
  }

  /**
   * Returns observable with the information if CDC script is loaded.
   */
  didLoad(): Observable<boolean> {
    return this.loaded$.asObservable();
  }

  /**
   * Returns observable with the information if CDC script failed to load.
   */
  didScriptFailToLoad(): Observable<boolean> {
    return this.errorLoading$.asObservable();
  }

  /**
   * Method which loads the CDC Script
   */
  loadCdcJavascript(): void {
    // Only load the script on client side (no SSR)
    if (isPlatformBrowser(this.platform)) {
      this.subscription.add(
        combineLatest([
          this.baseSiteService.getActive(),
          this.languageService.getActive(),
        ])
          .pipe(take(1))
          .subscribe(([baseSite, language]) => {
            const scriptForBaseSite =
              this.getJavascriptUrlForCurrentSite(baseSite);
            if (scriptForBaseSite) {
              const javascriptUrl = `${scriptForBaseSite}&lang=${language}`;
              this.scriptLoader.embedScript({
                src: javascriptUrl,
                params: undefined,
                attributes: { type: 'text/javascript' },
                callback: () => {
                  this.registerEventListeners(baseSite);
                  this.loaded$.next(true);
                  this.errorLoading$.next(false);
                },
                errorCallback: () => {
                  this.errorLoading$.next(true);
                  this.loaded$.next(false);
                },
              });
              if (this.winRef?.nativeWindow !== undefined) {
                (this.winRef.nativeWindow as { [key: string]: any })[
                  '__gigyaConf'
                ] = {
                  include: 'id_token',
                };
              }
            }
          })
      );
    }
  }

  /**
   * Method obtains the CDC SDK URL for a base site
   * @param baseSite
   * @returns CDC SDK URL
   */
  private getJavascriptUrlForCurrentSite(baseSite: string): string {
    const filteredConfigs = (this.cdcConfig.cdc ?? []).filter(
      (conf) => conf.baseSite === baseSite
    );
    if (filteredConfigs && filteredConfigs.length > 0) {
      return filteredConfigs[0].javascriptUrl;
    }
    return '';
  }

  /**
   * Register login event listeners for CDC login
   *
   * @param baseSite
   */
  protected registerEventListeners(baseSite: string): void {
    this.addCdcEventHandlers(baseSite);
  }

  /**
   * Method to register CDC event handlers
   *
   * @param baseSite
   */
  protected addCdcEventHandlers(baseSite: string): void {
    this.gigyaSDK = (this.winRef.nativeWindow as { [key: string]: any })?.[
      'gigya'
    ];
    this.gigyaSDK?.accounts?.addEventHandlers({
      onLogin: (...params: any[]) =>
        this.onLoginEventHandler(baseSite, ...params),
    });
  }

  /**
   * Trigger login to Commerce once an onLogin event is triggered by CDC Screen Set.
   *
   * @param baseSite
   * @param response
   */
  protected onLoginEventHandler(baseSite: string, response?: any) {
    if (response) {
      if (!response?.context?.skipOccAuth) {
        //skip re-authentication during reset email
        this.cdcAuth.loginWithCustomCdcFlow(
          response.UID,
          response.UIDSignature,
          response.signatureTimestamp,
          response.id_token !== undefined ? response.id_token : '',
          baseSite
        );
      }
    }
  }

  /**
   * Trigger CDC User registration and log in using CDC APIs.
   *
   * @param user: UserSignUp
   */
  registerUserWithoutScreenSet(
    user: UserSignUp
  ): Observable<{ status: string }> {
    if (!user.uid || !user.password) {
      return throwError(null);
    } else {
      return this.invokeAPI('accounts.initRegistration', {}).pipe(
        switchMap((response) => this.onInitRegistrationHandler(user, response))
      );
    }
  }

  /**
   * Trigger CDC User registration using CDC APIs.
   *
   * @param user
   * @param response
   */
  protected onInitRegistrationHandler(
    user: UserSignUp,
    response: any
  ): Observable<{ status: string }> {
    if (!response?.regToken || !user?.uid || !user?.password) {
      return throwError(null);
    } else {
      let regSource: string = this.winRef.nativeWindow?.location?.href || '';
      return this.invokeAPI('accounts.register', {
        email: user.uid,
        password: user.password,
        profile: {
          firstName: user.firstName,
          lastName: user.lastName,
        },
        regSource: regSource,
        regToken: response.regToken,
        finalizeRegistration: true,
      }).pipe(
        tap({
          error: (response) => this.handleRegisterError(response),
        })
      );
    }
  }

  /**
   * Trigger CDC User log in using CDC APIs.
   *
   * @param email
   * @param password
   * @param context (optional) - indicates the user flow
   */
  loginUserWithoutScreenSet(
    email: string,
    password: string,
    context?: any
  ): Observable<{ status: string }> {
    return this.getSessionExpirationValue().pipe(
      switchMap((sessionExpiration) => {
        return this.invokeAPI('accounts.login', {
          loginID: email,
          password: password,
          ...(context && { context: context }),
          sessionExpiry: sessionExpiration,
        }).pipe(
          tap({
            error: (response) => this.handleLoginError(response),
          })
        );
      })
    );
  }

  /**
   * Show failure message to the user in case registration fails.
   *
   * @param response
   */
  protected handleRegisterError(response: any) {
    if (response && response.status === 'FAIL') {
      const errorMessage =
        (response.validationErrors &&
          response.validationErrors.length > 0 &&
          response.validationErrors[response.validationErrors.length - 1]
            .message) ||
        'Error';
      this.globalMessageService.add(
        errorMessage,
        GlobalMessageType.MSG_TYPE_ERROR
      );
    }
  }

  /**
   * Show failure message to the user in case login fails.
   *
   * @param response
   */
  protected handleLoginError(response: any) {
    if (response && response.status === 'FAIL') {
      this.globalMessageService.add(
        {
          key: 'httpHandlers.badRequestPleaseLoginAgain',
          params: {
            errorMessage: response.errorMessage,
          },
        },
        GlobalMessageType.MSG_TYPE_ERROR
      );
    }
  }

  protected getSessionExpirationValue(): Observable<number> {
    if (this.cdcConfig?.cdc !== undefined) {
      const filteredConfigs: any = this.cdcConfig.cdc.filter(
        (conf) => conf.baseSite === this.getCurrentBaseSite()
      );
      if (filteredConfigs && filteredConfigs.length > 0) {
        return of(filteredConfigs[0].sessionExpiration);
      }
    }
    // Return a default value
    return of(3600);
  }

  private getCurrentBaseSite(): string {
    let baseSite: string = '';
    this.baseSiteService
      .getActive()
      .pipe(take(1))
      .subscribe((data) => (baseSite = data));
    return baseSite;
  }

  /**
   * Trigger CDC forgot password using CDC APIs.
   *
   * @param email
   */
  resetPasswordWithoutScreenSet(email: string): Observable<{ status: string }> {
    if (!email || email?.length === 0) {
      return throwError(null);
    } else {
      return this.invokeAPI('accounts.resetPassword', {
        loginID: email,
      }).pipe(
        tap({
          error: (response) => this.handleResetPassResponse(response),
        })
      );
    }
  }

  /**
   * Response handler for forgot password
   * @param response
   */
  protected handleResetPassResponse(response: any) {
    if (response && response.status === 'OK') {
      this.globalMessageService.add(
        { key: 'forgottenPassword.passwordResetEmailSent' },
        GlobalMessageType.MSG_TYPE_CONFIRMATION
      );
    } else {
      this.globalMessageService.add(
        {
          key: 'httpHandlers.unknownError',
        },
        GlobalMessageType.MSG_TYPE_ERROR
      );
    }
  }

  /**
   * Trigger CDC Profile update.
   *
   * @param firstName
   * @param lastName
   */
  updateProfileWithoutScreenSet(user: User): Observable<{ status: string }> {
    if (
      !user?.firstName ||
      user?.firstName?.length === 0 ||
      !user?.lastName ||
      user?.lastName?.length === 0
    ) {
      return throwError(null);
    } else {
      let profileObj = {
        profile: {
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
      return this.invokeAPI('accounts.setAccountInfo', {
        ...profileObj,
      }).pipe(
        tap(() =>
          this.userProfileFacade.update(user as User).subscribe({
            error: (error) => of(error),
          })
        )
      );
    }
  }

  /**
   * Trigger CDC User Password update.
   *
   * @param oldPassword
   * @param newPassword
   */
  updateUserPasswordWithoutScreenSet(
    oldPassword: string,
    newPassword: string
  ): Observable<{ status: string }> {
    if (
      !oldPassword ||
      oldPassword?.length === 0 ||
      !newPassword ||
      newPassword?.length === 0
    ) {
      return throwError(null);
    } else {
      return this.invokeAPI('accounts.setAccountInfo', {
        password: oldPassword,
        newPassword: newPassword,
      }).pipe(
        tap({
          error: (error) => {
            let errorMessage = error.errorMessage;
            this.globalMessageService.add(
              errorMessage,
              GlobalMessageType.MSG_TYPE_ERROR
            );
          },
        })
      );
    }
  }

  /**
   * Updates user details using the existing User API
   *
   * @param response
   */
  onProfileUpdateEventHandler(response?: any) {
    if (response) {
      const userDetails: User = {};
      userDetails.firstName = response.profile.firstName;
      userDetails.lastName = response.profile.lastName;
      this.userProfileFacade.update(userDetails);
    }
  }

  /**
   * Trigger CDC user email update.
   *
   * @param password
   * @param newEmail
   */
  updateUserEmailWithoutScreenSet(
    password: string,
    newEmail: string
  ): Observable<{ status: string }> {
    if (
      !password ||
      password?.length === 0 ||
      !newEmail ||
      newEmail?.length === 0
    ) {
      return throwError('Email or password not provided');
    } else {
      //Verify the password by attempting to login
      return this.getLoggedInUserEmail().pipe(
        switchMap((user) => {
          let email = user?.uid;
          if (!email || email?.length === 0) {
            return throwError('Email or password not provided');
          }
          // Verify the password by attempting to login
          // - CDC doesn't require to verify password before changing an email, but the default Spartacus requires it.
          // - CDC doesn't have any specific api, for verifying a password, so as a _workaround_ we call the login API of CDC.
          //   We pass a special `context` parameter `'{ skipOccAuth: true }'`
          //   to avoid the full CDC login flow.
          //   Instead we want only half of the CDC login flow, just to verify if the password was correct.
          return this.loginUserWithoutScreenSet(email, password, {
            skipOccAuth: true,
          }).pipe(
            switchMap(() =>
              this.invokeAPI('accounts.setAccountInfo', {
                profile: {
                  email: newEmail,
                },
              }).pipe(
                tap({
                  next: () =>
                    this.userProfileFacade.update({ uid: newEmail }).pipe(
                      tap({
                        error: (error) => of(error),
                        complete: () => {
                          this.auth.coreLogout();
                          this.invokeAPI('accounts.logout', {});
                        },
                      })
                    ),
                })
              )
            ),
            catchError((error) => of(error))
          );
        })
      );
    }
  }

  /**
   * Obtain the email of the currently logged in user
   * @returns emailID of the loggedIn user
   */
  protected getLoggedInUserEmail(): Observable<User> {
    return this.userProfileFacade.get().pipe(
      take(1),
      filter((user): user is User => Boolean(user))
    );
  }

  /**
   * Trigger CDC address update.
   *
   * @param address
   */
  updateAddressWithoutScreenSet(
    formattedAddress: string,
    zipCode?: string,
    city?: string,
    country?: string
  ): Observable<{ status: string }> {
    if (!formattedAddress || formattedAddress?.length === 0) {
      return throwError({ errorMessage: 'No address provided' });
    } else {
      let profileObj = {
        address: formattedAddress,
        ...(city && { city: city }),
        ...(country && { country: country }),
        ...(zipCode && { zip: zipCode }),
      };
      return this.invokeAPI('accounts.setAccountInfo', {
        profile: profileObj,
      });
    }
  }

  /**
   * Obtain the CDC SDK Method from the input method name as string
   * @param methodName
   * @returns CDC SDK Function
   */
  protected getSdkFunctionFromName(
    methodName: string
  ): (payload: Object) => void {
    //accounts.setAccountInfo or accounts.b2b.openDelegatedAdmin
    let nestedMethods = methodName.split('.');
    let cdcAPI: any = this.gigyaSDK;
    nestedMethods.forEach((method) => {
      if (cdcAPI && cdcAPI.hasOwnProperty(method)) {
        cdcAPI = cdcAPI[method];
      }
    });

    return cdcAPI;
  }

  /**
   * Invoke the CDC SDK Method and convert the callback to an Observable
   * @param methodName - method to be invoked
   * @param payload - Object payload
   * @returns - Observable with the response
   */
  protected invokeAPI(
    methodName: string,
    payload: Object
  ): Observable<{ status: string }> {
    return new Observable<{ status: string }>((result) => {
      let actualAPI = this.getSdkFunctionFromName(methodName);

      actualAPI({
        ...payload,
        callback: (response: any) => {
          if (response?.status === 'OK') {
            result.next(response);
            result.complete();
          } else {
            result.error(response);
          }
        },
      });
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
