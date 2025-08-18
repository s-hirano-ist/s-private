import type { Status } from "@/domains/common/entities/common-entity";
import type { Content } from "@/domains/contents/entities/contents-entity";
import type { IContentsCommandRepository } from "@/domains/contents/types";
import { serverLogger } from "@/infrastructures/observability/server";
import prisma from "@/prisma";

class ContentsCommandRepository implements IContentsCommandRepository {
	async create(data: Content): Promise<void> {
		const response = await prisma.contents.create({ data });
		serverLogger.info(
			`【CONTENTS】\n\nコンテンツ\ntitle: ${response.title} \nquote: ${response.markdown}\nの登録ができました`,
			{ caller: "addContents", status: 201, userId: data.userId },
			{ notify: true },
		);
	}

	async deleteById(id: string, userId: string, status: Status): Promise<void> {
		const data = await prisma.contents.delete({
			where: { id, userId, status },
			select: { title: true },
		});
		serverLogger.info(
			`【CONTENTS】\n\n削除\ntitle: ${data.title}`,
			{ caller: "deleteContents", status: 200, userId },
			{ notify: true },
		);
	}
}

export const contentsCommandRepository = new ContentsCommandRepository();
