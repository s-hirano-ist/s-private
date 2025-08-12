import { cache } from "react";
import { contentsQueryRepository } from "@/features/contents/repositories/contents-query-repository";

export const getAllContents = cache(contentsQueryRepository.findAll);

export const getContentsCount = cache(contentsQueryRepository.count);
