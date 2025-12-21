/**
 * Configuration for the notification service.
 *
 * @remarks
 * Contains the credentials and endpoint URL required to send
 * notifications via the Pushover API.
 *
 * @see {@link createPushoverService} for creating a notification service instance
 */
export type NotificationConfig = {
	/** The Pushover API endpoint URL */
	url: string;
	/** The user key for authentication */
	userKey: string;
	/** The application token for authentication */
	appToken: string;
};

/**
 * Context information for a notification.
 *
 * @remarks
 * Provides additional context about the source of the notification,
 * which is included in the notification message for debugging purposes.
 */
export type NotificationContext = {
	/** The name of the service or function that triggered the notification */
	caller: string;
	/** Optional user identifier for user-specific notifications */
	userId?: string;
};

/**
 * Interface for notification service implementations.
 *
 * @remarks
 * Defines the contract for sending notifications at different priority levels.
 * Each method enriches the message with context information and sends it
 * with an appropriate priority level.
 *
 * Priority levels:
 * - Error: High priority (1) - immediate attention required
 * - Warning: Normal priority (0) - standard notification
 * - Info: Low priority (-1) - informational only
 *
 * @example
 * ```typescript
 * const service: NotificationService = createPushoverService(config);
 *
 * // Error notifications are high priority
 * await service.notifyError("Critical failure", { caller: "PaymentService" });
 *
 * // Warning notifications are normal priority
 * await service.notifyWarning("Slow response time", { caller: "APIMonitor" });
 *
 * // Info notifications are low priority
 * await service.notifyInfo("Daily report generated", { caller: "ReportService" });
 * ```
 */
export type NotificationService = {
	/**
	 * Sends a high-priority error notification.
	 *
	 * @param message - The error message to send
	 * @param context - Context information about the notification source
	 */
	notifyError(message: string, context: NotificationContext): Promise<void>;
	/**
	 * Sends a normal-priority warning notification.
	 *
	 * @param message - The warning message to send
	 * @param context - Context information about the notification source
	 */
	notifyWarning(message: string, context: NotificationContext): Promise<void>;
	/**
	 * Sends a low-priority informational notification.
	 *
	 * @param message - The info message to send
	 * @param context - Context information about the notification source
	 */
	notifyInfo(message: string, context: NotificationContext): Promise<void>;
};
