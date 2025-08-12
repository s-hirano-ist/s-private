import { cache } from "react";
import { newsQueryRepository } from "@/features/news/repositories/news-query-repository";

export const getNews = cache(newsQueryRepository.findExportedMany);

export const getNewsCount = cache(newsQueryRepository.count);
