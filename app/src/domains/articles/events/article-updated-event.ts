import { BaseDomainEvent } from "@/domains/common/events/base-domain-event";

export class ArticleUpdatedEvent extends BaseDomainEvent {
	constructor(data: {
		title: string;
		url: string;
		quote: string;
		categoryName: string;
		userId: string;
		caller: string;
	}) {
		super(
			"article.updated",
			{
				title: data.title,
				url: data.url,
				quote: data.quote,
				categoryName: data.categoryName,
			},
			{
				caller: data.caller,
				userId: data.userId,
			},
		);
	}
}
