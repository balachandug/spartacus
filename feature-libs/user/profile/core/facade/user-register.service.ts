/*
 * SPDX-FileCopyrightText: 2023 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Injectable } from '@angular/core';
import {
  AuthService,
  Command,
  CommandService,
  UserActions,
} from '@spartacus/core';
import { User } from '@spartacus/user/account/root';
import { Observable } from 'rxjs';
import {
  Title,
  UserRegisterFacade,
  UserSignUp,
} from '@spartacus/user/profile/root';
import { UserProfileConnector } from '../connectors/user-profile.connector';
import { tap } from 'rxjs/operators';
import { UserProfileService } from './user-profile.service';
import { Store } from '@ngrx/store';

@Injectable()
export class UserRegisterService implements UserRegisterFacade {
  protected registerCommand: Command<{ user: UserSignUp }, User> =
    this.command.create(({ user }) =>
      this.userConnector.register(user).pipe(
        tap(() => {
          // this is a compatibility mechanism only, to make anonymous consents
          // management work properly in transitional period (when we move logic
          // to separate libraries)
          this.store.dispatch(new UserActions.RegisterUserSuccess());
        })
      )
    );

  protected registerGuestCommand: Command<
    {
      guid: string;
      password: string;
    },
    User
  > = this.command.create((payload) =>
    this.userConnector.registerGuest(payload.guid, payload.password).pipe(
      tap((user) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.authService.loginWithCredentials(user.uid!, payload.password);
      })
    )
  );

  constructor(
    protected userProfile: UserProfileService,
    protected userConnector: UserProfileConnector,
    protected authService: AuthService,
    protected command: CommandService,
    protected store: Store
  ) {}

  /**
   * Register a new user.
   *
   * @param submitFormData as UserRegisterFormData
   */
  register(user: UserSignUp): Observable<User> {
    return this.registerCommand.execute({ user });
  }

  /**
   * Register a new user from guest.
   *
   * @param guid
   * @param password
   */
  registerGuest(guid: string, password: string): Observable<User> {
    return this.registerGuestCommand.execute({ guid, password });
  }

  /**
   * Returns titles that can be used for the user profiles.
   */
  getTitles(): Observable<Title[]> {
    return this.userProfile.getTitles();
  }
}
