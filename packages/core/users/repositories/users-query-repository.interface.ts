import type { UserId } from "../../shared-kernel/entities/common-entity.ts";
import type { Role } from "../entities/user-entity.ts";

/**
 * Query repository interface for the User domain.
 *
 * @remarks
 * Follows the CQRS pattern - this interface handles read operations only.
 * Implementations should be provided by the infrastructure layer (e.g., Prisma).
 * Roles are the authorization source of truth, sourced from the database.
 */
export type IUsersQueryRepository = {
	/**
	 * Finds the roles assigned to a user.
	 *
	 * @param userId - The user ID (Auth0 sub) to look up
	 * @returns The user's roles, or an empty array if the user is not registered
	 */
	findRolesById(userId: UserId): Promise<Role[]>;
};
