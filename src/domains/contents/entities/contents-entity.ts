import { z } from "zod";

export const contentsEntity = z.object({
	title: z
		.string({ message: "required" })
		.min(1, { message: "required" })
		.max(64, { message: "tooLong" }),
	markdown: z.string({ message: "required" }).min(1, { message: "required" }),
	userId: z.string({ message: "required" }),
	id: z.string(),
});

export type ContentsEntity = z.infer<typeof contentsEntity>;
