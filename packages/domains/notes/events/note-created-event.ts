import { BaseDomainEvent } from "../../common/events/base-domain-event";

export class NoteCreatedEvent extends BaseDomainEvent {
	constructor(data: {
		title: string;
		markdown: string;
		userId: string;
		caller: string;
	}) {
		super(
			"note.created",
			{
				title: data.title,
				markdown: data.markdown,
			},
			{
				caller: data.caller,
				userId: data.userId,
			},
		);
	}
}
