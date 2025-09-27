import { BaseDomainEvent } from "../../common/events/base-domain-event";

export class ImageDeletedEvent extends BaseDomainEvent {
	constructor(data: {
		path: string;
		userId: string;
		caller: string;
	}) {
		super(
			"image.deleted",
			{
				path: data.path,
			},
			{
				caller: data.caller,
				userId: data.userId,
			},
		);
	}
}
