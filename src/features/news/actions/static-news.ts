import { staticNewsRepository } from "@/features/news/repositories/static-news-repository";

export const getStaticNews = staticNewsRepository.findMany;

export const getStaticNewsCount = staticNewsRepository.count;
