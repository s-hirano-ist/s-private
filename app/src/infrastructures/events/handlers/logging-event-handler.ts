import type {
	DomainEvent,
	DomainEventHandler,
} from "s-core/common/events/domain-event.interface";
import { serverLogger } from "@/infrastructures/observability/server";

export class LoggingEventHandler implements DomainEventHandler {
	async handle(event: DomainEvent): Promise<void> {
		const { eventType, payload, metadata } = event;

		let message: string;

		switch (eventType) {
			case "article.created":
				message = `【ARTICLE】\n\nコンテンツ\ntitle: ${payload.title} \nquote: ${payload.quote} \nurl: ${payload.url}\ncategory: ${payload.categoryName}\nの登録ができました`;
				break;
			case "article.deleted":
				message = `【ARTICLE】\n\n削除\ntitle: ${payload.title}`;
				break;
			case "note.created":
				message = `【NOTES】\n\nノート\ntitle: ${payload.title} \nquote: ${payload.markdown}\nの登録ができました`;
				break;
			case "note.deleted":
				message = `【NOTES】\n\n削除\ntitle: ${payload.title}`;
				break;
			case "image.created":
				message = `【IMAGE】\n\nコンテンツ\nfileName: ${payload.fileName}\nの登録ができました`;
				break;
			case "image.deleted":
				message = `【IMAGE】\n\n削除\npath: ${payload.path}`;
				break;
			case "book.created":
				message = `【BOOKS】\n\nコンテンツ\nISBN: ${payload.ISBN} \ntitle: ${payload.title}\nの登録ができました`;
				break;
			case "book.deleted":
				message = `【BOOKS】\n\n削除\ntitle: ${payload.title}`;
				break;
			default:
				message = `Unknown event: ${eventType}`;
		}

		const status = eventType.includes("created") ? 201 : 200;

		serverLogger.info(
			message,
			{
				caller: metadata.caller,
				status,
				userId: metadata.userId,
			},
			{ notify: true },
		);
	}
}
