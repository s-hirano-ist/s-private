import { staticNewsRepository } from "@/features/viewer/repositories/static-news-repository";

export const getStaticNews = staticNewsRepository.findMany;

export const getStaticNewsCount = staticNewsRepository.count;
