import { BaseDomainEvent } from "./base-domain-event";

export class SystemWarningEvent extends BaseDomainEvent {
	constructor(data: {
		message: string;
		status: number;
		caller: string;
		userId?: string;
		extraData?: unknown;
		shouldNotify?: boolean;
	}) {
		super(
			"system.warning",
			{
				message: data.message,
				status: data.status,
				extraData: data.extraData,
				shouldNotify: data.shouldNotify ?? false,
			},
			{
				caller: data.caller,
				userId: data.userId ?? "system",
			},
		);
	}
}
