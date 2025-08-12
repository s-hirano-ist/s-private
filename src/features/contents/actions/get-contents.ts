import { cache } from "react";
import { contentsRepository } from "@/features/contents/repositories/contents-repository";

export const getAllContents = cache(contentsRepository.findAll);

export const getContentsCount = cache(contentsRepository.count);
