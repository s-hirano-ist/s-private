import { z } from "zod";

// Base domain event
export const baseDomainEventSchema = z.object({
	id: z.string().uuid(),
	aggregateId: z.string(),
	aggregateType: z.string(),
	eventType: z.string(),
	version: z.number().int().positive(),
	occurredOn: z.date(),
	userId: z.string(),
	metadata: z.record(z.unknown()).optional(),
});

export type BaseDomainEvent = z.infer<typeof baseDomainEventSchema>;

// Specific domain events
export const bookCreatedEventSchema = baseDomainEventSchema.extend({
	eventType: z.literal("BookCreated"),
	aggregateType: z.literal("Book"),
	data: z.object({
		isbn: z.string(),
		title: z.string(),
	}),
});

export const bookStatusChangedEventSchema = baseDomainEventSchema.extend({
	eventType: z.literal("BookStatusChanged"),
	aggregateType: z.literal("Book"),
	data: z.object({
		oldStatus: z.enum(["UNEXPORTED", "EXPORTED"]),
		newStatus: z.enum(["UNEXPORTED", "EXPORTED"]),
	}),
});

export const newsCreatedEventSchema = baseDomainEventSchema.extend({
	eventType: z.literal("NewsCreated"),
	aggregateType: z.literal("News"),
	data: z.object({
		title: z.string(),
		url: z.string(),
		categoryName: z.string(),
	}),
});

export const newsDeletedEventSchema = baseDomainEventSchema.extend({
	eventType: z.literal("NewsDeleted"),
	aggregateType: z.literal("News"),
	data: z.object({}),
});

export const contentCreatedEventSchema = baseDomainEventSchema.extend({
	eventType: z.literal("ContentCreated"),
	aggregateType: z.literal("Content"),
	data: z.object({
		title: z.string(),
		wordCount: z.number(),
	}),
});

export const imageUploadedEventSchema = baseDomainEventSchema.extend({
	eventType: z.literal("ImageUploaded"),
	aggregateType: z.literal("Image"),
	data: z.object({
		path: z.string(),
		contentType: z.string(),
		fileSize: z.number().optional(),
	}),
});

// Union type for all domain events
export const domainEventSchema = z.discriminatedUnion("eventType", [
	bookCreatedEventSchema,
	bookStatusChangedEventSchema,
	newsCreatedEventSchema,
	newsDeletedEventSchema,
	contentCreatedEventSchema,
	imageUploadedEventSchema,
]);

export type DomainEvent = z.infer<typeof domainEventSchema>;

// Event types
export type BookCreatedEvent = z.infer<typeof bookCreatedEventSchema>;
export type BookStatusChangedEvent = z.infer<
	typeof bookStatusChangedEventSchema
>;
export type NewsCreatedEvent = z.infer<typeof newsCreatedEventSchema>;
export type NewsDeletedEvent = z.infer<typeof newsDeletedEventSchema>;
export type ContentCreatedEvent = z.infer<typeof contentCreatedEventSchema>;
export type ImageUploadedEvent = z.infer<typeof imageUploadedEventSchema>;

// Event factory functions
export const DomainEventFactory = {
	bookCreated: (
		aggregateId: string,
		userId: string,
		data: { isbn: string; title: string },
		metadata?: Record<string, unknown>,
	): BookCreatedEvent => ({
		id: crypto.randomUUID(),
		aggregateId,
		aggregateType: "Book",
		eventType: "BookCreated",
		version: 1,
		occurredOn: new Date(),
		userId,
		data,
		metadata,
	}),

	bookStatusChanged: (
		aggregateId: string,
		userId: string,
		data: {
			oldStatus: "UNEXPORTED" | "EXPORTED";
			newStatus: "UNEXPORTED" | "EXPORTED";
		},
		metadata?: Record<string, unknown>,
	): BookStatusChangedEvent => ({
		id: crypto.randomUUID(),
		aggregateId,
		aggregateType: "Book",
		eventType: "BookStatusChanged",
		version: 1,
		occurredOn: new Date(),
		userId,
		data,
		metadata,
	}),

	newsCreated: (
		aggregateId: string,
		userId: string,
		data: { title: string; url: string; categoryName: string },
		metadata?: Record<string, unknown>,
	): NewsCreatedEvent => ({
		id: crypto.randomUUID(),
		aggregateId,
		aggregateType: "News",
		eventType: "NewsCreated",
		version: 1,
		occurredOn: new Date(),
		userId,
		data,
		metadata,
	}),

	newsDeleted: (
		aggregateId: string,
		userId: string,
		data: {},
		metadata?: Record<string, unknown>,
	): NewsDeletedEvent => ({
		id: crypto.randomUUID(),
		aggregateId,
		aggregateType: "News",
		eventType: "NewsDeleted",
		version: 1,
		occurredOn: new Date(),
		userId,
		data,
		metadata,
	}),

	contentCreated: (
		aggregateId: string,
		userId: string,
		data: { title: string; wordCount: number },
		metadata?: Record<string, unknown>,
	): ContentCreatedEvent => ({
		id: crypto.randomUUID(),
		aggregateId,
		aggregateType: "Content",
		eventType: "ContentCreated",
		version: 1,
		occurredOn: new Date(),
		userId,
		data,
		metadata,
	}),

	imageUploaded: (
		aggregateId: string,
		userId: string,
		data: { path: string; contentType: string; fileSize?: number },
		metadata?: Record<string, unknown>,
	): ImageUploadedEvent => ({
		id: crypto.randomUUID(),
		aggregateId,
		aggregateType: "Image",
		eventType: "ImageUploaded",
		version: 1,
		occurredOn: new Date(),
		userId,
		data,
		metadata,
	}),
};
