/**
 * @packageDocumentation
 *
 * Notification service library for the content management system.
 *
 * @remarks
 * Provides push notification capabilities via Pushover service.
 * Supports error, warning, and info level notifications with
 * configurable priority levels.
 *
 * @example
 * ```typescript
 * import {
 *   createPushoverService,
 *   type NotificationConfig,
 *   type NotificationContext
 * } from "@s-hirano-ist/s-notification";
 *
 * const config: NotificationConfig = {
 *   url: "https://api.pushover.net/1/messages.json",
 *   userKey: "your-user-key",
 *   appToken: "your-app-token"
 * };
 *
 * const notificationService = createPushoverService(config);
 *
 * // Send error notification (high priority)
 * await notificationService.notifyError("Database connection failed", {
 *   caller: "DatabaseService",
 *   userId: "user-123"
 * });
 *
 * // Send warning notification (normal priority)
 * await notificationService.notifyWarning("High memory usage detected", {
 *   caller: "MemoryMonitor"
 * });
 *
 * // Send info notification (low priority)
 * await notificationService.notifyInfo("Backup completed successfully", {
 *   caller: "BackupService"
 * });
 * ```
 */
export * from "./errors.js";
export { createPushoverService } from "./pushover.js";
export * from "./types.js";
