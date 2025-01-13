import { Pagination } from "@/components/stack/pagination";
import { Badge } from "@/components/ui/badge";
import { ERROR_MESSAGES } from "@/constants";
import { getUserId } from "@/features/auth/utils/get-session";
import { loggerError } from "@/pino";
import prisma from "@/prisma";

type Props = { currentPage: number };

export async function ImagePagination({ currentPage }: Props) {
	try {
		const userId = await getUserId();
		const totalImages = await prisma.images.count({
			where: { userId },
		});

		return (
			<>
				<Badge className="m-2 flex justify-center">画像数: {totalImages}</Badge>
				<Pagination currentPage={currentPage} totalPages={totalImages} />
			</>
		);
	} catch (error) {
		loggerError(
			ERROR_MESSAGES.UNEXPECTED,
			{
				caller: "ImagePage",
				status: 500,
			},
			error,
		);
		return <></>;
	}
}
