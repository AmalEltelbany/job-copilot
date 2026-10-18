import type { SourceKind } from '@copilot/shared';
import { ashbyAdapter } from './ashby.js';
import { greenhouseAdapter } from './greenhouse.js';
import { leverAdapter } from './lever.js';
import { remotiveAdapter } from './remotive.js';
import type { SourceAdapter } from './types.js';

export const SOURCE_ADAPTERS = Symbol('SOURCE_ADAPTERS');
export type SourceAdapters = Record<SourceKind, SourceAdapter>;

export function defaultAdapters(): SourceAdapters {
  return { GREENHOUSE: greenhouseAdapter(), LEVER: leverAdapter(), ASHBY: ashbyAdapter(), REMOTIVE: remotiveAdapter() };
}
