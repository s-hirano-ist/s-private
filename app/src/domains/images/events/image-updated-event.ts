import { BaseDomainEvent } from "../../common/events/base-domain-event";

export class ImageUpdatedEvent extends BaseDomainEvent {
	constructor(data: {
		id: string;
		path: string;
		userId: string;
		caller: string;
	}) {
		super(
			"image.updated",
			{
				id: data.id,
				path: data.path,
			},
			{
				caller: data.caller,
				userId: data.userId,
			},
		);
	}
}
