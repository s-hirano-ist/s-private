import type { IUsersQueryRepository } from "@s-hirano-ist/s-core/users/repositories/users-query-repository.interface";
import prisma from "@/prisma";
import {
	makeRole,
	type Role,
} from "@s-hirano-ist/s-core/users/entities/user-entity";

async function findRolesById(userId: string): Promise<Role[]> {
	const data = await prisma.user.findUnique({
		where: { id: userId },
		select: { roles: true },
	});
	if (!data) return [];
	return data.roles.map((r) => makeRole(r));
}

export const usersQueryRepository: IUsersQueryRepository = { findRolesById };
