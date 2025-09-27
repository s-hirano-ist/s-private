import { BaseDomainEvent } from "@/domains/common/events/base-domain-event";

export class ArticleDeletedEvent extends BaseDomainEvent {
	constructor(data: {
		title: string;
		userId: string;
		caller: string;
	}) {
		super(
			"article.deleted",
			{
				title: data.title,
			},
			{
				caller: data.caller,
				userId: data.userId,
			},
		);
	}
}
