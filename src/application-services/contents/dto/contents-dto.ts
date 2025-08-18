import type { z } from "zod";
import { content } from "@/domains/contents/entities/contents-entity";

export const getContentArgs = content.omit({
	userId: true,
	status: true,
});
export type GetContentArgs = z.infer<typeof getContentArgs>;

export const getContentListArgs = content.omit({
	userId: true,
	status: true,
	markdown: true,
});
export type GetContentListArgs = z.infer<typeof getContentListArgs>;
