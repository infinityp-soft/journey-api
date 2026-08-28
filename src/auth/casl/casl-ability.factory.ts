import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import { UserRole } from '../../common/enums';
import { Action } from './action.enum';
import { AppSubject, EDITOR_CONTENT_SUBJECTS } from './subjects';

export type AppAbility = MongoAbility<[Action, AppSubject | Record<string, any>]>;

/** Minimal identity extracted from the validated JWT (see auth strategy). */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: AuthUser): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    switch (user.role) {
      // ADMIN — Super Administrator. Full control over every module.
      case UserRole.admin: {
        can(Action.Manage, 'all');
        break;
      }

      // EDITOR — content manager. Full CRUD + publish on content modules,
      // handles leads and event registrations, reads everything, and can
      // update only their OWN account.
      case UserRole.editor: {
        can(Action.Read, 'all');
        can(Action.Manage, EDITOR_CONTENT_SUBJECTS as AppSubject[]);
        can(Action.Update, 'User', { id: user.id });
        cannot(Action.Create, 'User');
        cannot(Action.Delete, 'User');
        cannot(Action.Update, 'SiteSettings');
        cannot(Action.Manage, 'SocialLink');
        cannot(Action.Manage, 'PreFooterHighlight');
        cannot(Action.Delete, 'ActivityLog');
        break;
      }

      // VIEWER — read-only across the CMS, plus update their own account.
      case UserRole.viewer:
      default: {
        can(Action.Read, 'all');
        can(Action.Update, 'User', { id: user.id });
        break;
      }
    }

    return build({
      detectSubjectType: (item) =>
        (typeof item === 'string'
          ? item
          : (item as { __caslSubjectType__?: AppSubject })
              .__caslSubjectType__) as AppSubject,
    });
  }
}
