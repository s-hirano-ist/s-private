import type { MobileDeps } from "@s-hirano-ist/s-backend/mobile/deps";
import { defaultMobileDeps } from "@/application-services/mobile/deps";
import { runMobileOperation as execute } from "@s-hirano-ist/s-backend/mobile/operations";
export {
	mobileInputHash,
	type MobileCreateResult,
} from "@s-hirano-ist/s-backend/mobile/operations";
export const runMobileOperation = (
	userId: string,
	domain: string,
	operationId: string,
	input: unknown,
	work: () => Promise<string>,
	deps: Pick<MobileDeps, "operations"> = defaultMobileDeps,
) => execute(userId, domain, operationId, input, work, deps);
