import { BaseDomainEvent } from "../../common/events/base-domain-event";

export class BookCreatedEvent extends BaseDomainEvent {
	constructor(data: {
		ISBN: string;
		title: string;
		userId: string;
		caller: string;
	}) {
		super(
			"book.created",
			{
				ISBN: data.ISBN,
				title: data.title,
			},
			{
				caller: data.caller,
				userId: data.userId,
			},
		);
	}
}
