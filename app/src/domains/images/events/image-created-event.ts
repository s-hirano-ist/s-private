import { BaseDomainEvent } from "../../common/events/base-domain-event";

export class ImageCreatedEvent extends BaseDomainEvent {
	constructor(data: {
		id: string;
		userId: string;
		caller: string;
	}) {
		super(
			"image.created",
			{
				fileName: data.id,
			},
			{
				caller: data.caller,
				userId: data.userId,
			},
		);
	}
}
