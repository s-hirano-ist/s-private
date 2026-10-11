import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import type { SearchQuery } from "@s-hirano-ist/s-core/shared-kernel/types/search-types";
import { searchVectors } from "@/infrastructures/search/search-service";
import { searchContent as execute } from "@s-hirano-ist/s-backend/search/search-content";
export const searchContent = (query: SearchQuery, userId: UserId) =>
	execute(query, userId, searchVectors);
