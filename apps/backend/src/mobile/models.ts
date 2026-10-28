import type {
	contentDomainSchema,
	syncDomainSchema,
} from "@s-hirano-ist/s-api-contracts/schemas";
import type { z } from "zod";
export type MobileDomain = z.output<typeof contentDomainSchema>;
export type SyncDomain = z.output<typeof syncDomainSchema>;
