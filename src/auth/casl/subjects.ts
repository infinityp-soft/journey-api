/**
 * Authorization subjects — one per business entity / module in the schema.
 *
 * These are string subjects so the ability layer works even before ORM entity
 * classes exist. Row/field-level checks against a concrete record tag the
 * object with the CASL `subject()` helper, e.g.:
 *
 *   import { subject } from '@casl/ability';
 *   ability.can(Action.Update, subject('User', userRow));
 */
export type AppSubject =
  | 'User'
  | 'ActivityLog'
  | 'Media'
  | 'Banner'
  | 'AboutUs'
  | 'Highlight'
  | 'Staff'
  | 'Destination'
  | 'Article'
  | 'ArticleCategory'
  | 'VisaService'
  | 'VisaDocument'
  | 'Testimonial'
  | 'Video'
  | 'VideoPageSettings'
  | 'Event'
  | 'EventFormField'
  | 'EventRegistration'
  | 'Lead'
  | 'SiteSettings'
  | 'SocialLink'
  | 'PreFooterHighlight'
  | 'all';

/**
 * Content subjects an Editor is allowed to fully manage (create/read/update/
 * delete/publish). Excludes system config (User, SiteSettings, SocialLink,
 * PreFooterHighlight, ActivityLog) which stays admin-only for writes.
 */
export const EDITOR_CONTENT_SUBJECTS: AppSubject[] = [
  'Media',
  'Banner',
  'AboutUs',
  'Highlight',
  'Staff',
  'Destination',
  'Article',
  'ArticleCategory',
  'VisaService',
  'VisaDocument',
  'Testimonial',
  'Video',
  'VideoPageSettings',
  'Event',
  'EventFormField',
  'EventRegistration',
  'Lead',
];
