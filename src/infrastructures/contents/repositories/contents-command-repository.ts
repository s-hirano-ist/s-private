import type {
	ContentsCreateInput,
	IContentsCommandRepository,
} from "@/domains/contents/types";
import { serverLogger } from "@/o11y/server";
import prisma from "@/prisma";

class ContentsCommandRepository implements IContentsCommandRepository {
	async create(data: ContentsCreateInput): Promise<void> {
		const response = await prisma.contents.create({ data });
		serverLogger.info(
			`【CONTENTS】\n\nコンテンツ\ntitle: ${response.title} \nquote: ${response.markdown}\nの登録ができました`,
			{ caller: "addContents", status: 201, userId: data.userId },
			{ notify: true },
		);
	}
}

export const contentsCommandRepository = new ContentsCommandRepository();
