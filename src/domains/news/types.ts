import { DomainError, Result } from "@/domains/common/value-objects";
import type {
	CategoryAggregate,
	CategoryId,
	NewsAggregate,
	NewsId,
	NewsStatus,
	UserId,
} from "./entities/news-entity";
import type { CategoryName, NewsTitle, NewsUrl } from "./value-objects";

// Functional repository interfaces
export type INewsCommandRepository = {
	save(news: NewsAggregate): Promise<Result<void, DomainError>>;
	delete(
		id: NewsId,
		userId: UserId,
		status: NewsStatus,
	): Promise<Result<void, DomainError>>;
};

export type INewsQueryRepository = {
	findById(
		id: NewsId,
		userId: UserId,
	): Promise<Result<NewsAggregate | null, DomainError>>;
	findByUrl(
		url: NewsUrl,
		userId: UserId,
	): Promise<Result<NewsAggregate | null, DomainError>>;
	findMany(
		userId: UserId,
		status: NewsStatus,
		params?: NewsFindManyParams,
	): Promise<Result<NewsAggregate[], DomainError>>;
	count(
		userId: UserId,
		status: NewsStatus,
	): Promise<Result<number, DomainError>>;
};

export type ICategoryQueryRepository = {
	findById(
		id: CategoryId,
		userId: UserId,
	): Promise<Result<CategoryAggregate | null, DomainError>>;
	findByName(
		name: CategoryName,
		userId: UserId,
	): Promise<Result<CategoryAggregate | null, DomainError>>;
	findMany(
		userId: UserId,
		params?: CategoryFindManyParams,
	): Promise<Result<CategoryAggregate[], DomainError>>;
};

export type ICategoryCommandRepository = {
	save(category: CategoryAggregate): Promise<Result<void, DomainError>>;
	delete(id: CategoryId, userId: UserId): Promise<Result<void, DomainError>>;
};

// Query parameters with functional types
export type SortOrder = "asc" | "desc";

export type CacheStrategy = {
	ttl?: number;
	swr?: number;
	tags?: string[];
};

export type NewsOrderByField = keyof NewsAggregate;
export type CategoryOrderByField = keyof CategoryAggregate;

export type NewsOrderBy = Partial<Record<NewsOrderByField, SortOrder>>;
export type CategoryOrderBy = Partial<Record<CategoryOrderByField, SortOrder>>;

export type NewsFindManyParams = {
	orderBy?: NewsOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

export type CategoryFindManyParams = {
	orderBy?: CategoryOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

// Domain service dependencies
export type NewsDomainDeps = {
	readonly newsCommandRepository: INewsCommandRepository;
	readonly newsQueryRepository: INewsQueryRepository;
	readonly categoryCommandRepository: ICategoryCommandRepository;
	readonly categoryQueryRepository: ICategoryQueryRepository;
};

// Command and query types
export type CreateNewsCommand = {
	title: NewsTitle;
	url: NewsUrl;
	quote?: string | null;
	categoryName: CategoryName;
	userId: UserId;
};

export type UpdateNewsCommand = {
	id: NewsId;
	userId: UserId;
	title?: NewsTitle;
	quote?: string | null;
	categoryName?: CategoryName;
};

export type DeleteNewsCommand = {
	id: NewsId;
	userId: UserId;
	status: NewsStatus;
};

// Event types for domain events
export type NewsDomainEvents = {
	NewsCreated: {
		newsId: NewsId;
		title: NewsTitle;
		url: NewsUrl;
		categoryId: CategoryId;
		userId: UserId;
	};
	NewsUpdated: {
		newsId: NewsId;
		userId: UserId;
		changes: Partial<NewsAggregate>;
	};
	NewsDeleted: {
		newsId: NewsId;
		userId: UserId;
	};
	CategoryCreated: {
		categoryId: CategoryId;
		name: CategoryName;
		userId: UserId;
	};
};
