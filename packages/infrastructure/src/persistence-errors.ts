import { ApplicationError } from "@s-hirano-ist/s-application/error";
import { Prisma } from "@s-hirano-ist/s-database";
export async function withPersistenceErrors<T>(
	work: () => Promise<T>,
	duplicate: "DUPLICATE" | "FORBIDDEN" = "DUPLICATE",
): Promise<T> {
	try {
		return await work();
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2002") throw new ApplicationError(duplicate);
			if (error.code === "P2025") throw new ApplicationError("NOT_FOUND");
		}
		throw error;
	}
}
