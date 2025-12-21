/**
 * @packageDocumentation
 *
 * Core domain library for the content management system.
 *
 * @remarks
 * This package provides domain entities, repositories, services, and events
 * following Domain-Driven Design (DDD) and Clean Architecture principles.
 *
 * ## Domains
 *
 * - **Articles** - News and link management with OG metadata
 * - **Books** - ISBN-based book tracking with Google Books integration
 * - **Notes** - Markdown-based content creation
 * - **Images** - File metadata and image processing
 * - **Common** - Shared entities, events, and services
 * - **Errors** - Domain-specific error classes
 *
 * @example
 * ```typescript
 * import { Articles, Books, Notes, Images, Common, Errors } from "@repo/core";
 *
 * // Create an article
 * const article = Articles.articleEntity.create({
 *   userId: Common.makeUserId("user-123"),
 *   title: Articles.makeArticleTitle("My Article"),
 *   url: Articles.makeUrl("https://example.com"),
 * });
 * ```
 */

// Domain exports with namespaces
export * as Articles from "./articles";
export * as Books from "./books";
export * as Common from "./common";
export * as Errors from "./errors";
export * as Images from "./images";
export * as Notes from "./notes";
