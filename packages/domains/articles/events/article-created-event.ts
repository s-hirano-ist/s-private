import { BaseDomainEvent } from "../../common/events/base-domain-event";

export class ArticleCreatedEvent extends BaseDomainEvent {
	constructor(data: {
		title: string;
		url: string;
		quote: string;
		categoryName: string;
		userId: string;
		caller: string;
	}) {
		super(
			"article.created",
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
