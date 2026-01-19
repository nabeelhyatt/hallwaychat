/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as chapterSummaries from "../chapterSummaries.js";
import type * as chapters from "../chapters.js";
import type * as clips from "../clips.js";
import type * as episodes from "../episodes.js";
import type * as lib_transcriptParser from "../lib/transcriptParser.js";
import type * as lib_urlValidator from "../lib/urlValidator.js";
import type * as processingJobs from "../processingJobs.js";
import type * as rss from "../rss.js";
import type * as topics from "../topics.js";
import type * as transcriptImport from "../transcriptImport.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  chapterSummaries: typeof chapterSummaries;
  chapters: typeof chapters;
  clips: typeof clips;
  episodes: typeof episodes;
  "lib/transcriptParser": typeof lib_transcriptParser;
  "lib/urlValidator": typeof lib_urlValidator;
  processingJobs: typeof processingJobs;
  rss: typeof rss;
  topics: typeof topics;
  transcriptImport: typeof transcriptImport;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
