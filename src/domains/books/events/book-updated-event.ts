import { BaseDomainEvent } from "@/domains/common/events/base-domain-event";

export class BookUpdatedEvent extends BaseDomainEvent {
	constructor(data: {
		ISBN: string;
		title: string;
		userId: string;
		caller: string;
	}) {
		super(
			"book.updated",
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
