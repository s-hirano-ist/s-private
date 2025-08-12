import { cache } from "react";
import { newsRepository } from "@/features/news/repositories/news-repository";

export const getNews = cache(newsRepository.findExportedMany);

export const getNewsCount = cache(newsRepository.count);
