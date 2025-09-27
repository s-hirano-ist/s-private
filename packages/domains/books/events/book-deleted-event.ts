import { BaseDomainEvent } from "../../common/events/base-domain-event";

export class BookDeletedEvent extends BaseDomainEvent {
	constructor(data: {
		title: string;
		userId: string;
		caller: string;
	}) {
		super(
			"book.deleted",
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
