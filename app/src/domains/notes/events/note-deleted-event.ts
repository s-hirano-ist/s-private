import { BaseDomainEvent } from "@/domains/common/events/base-domain-event";

export class NoteDeletedEvent extends BaseDomainEvent {
	constructor(data: {
		title: string;
		userId: string;
		caller: string;
	}) {
		super(
			"note.deleted",
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
