/**
 * CASL actions used across the CMS.
 * `Manage` is CASL's wildcard — it matches every other action.
 * `Publish` is a domain action for content that has a publish lifecycle
 * (articles, destinations, videos, testimonials, events).
 */
export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Publish = 'publish',
}
