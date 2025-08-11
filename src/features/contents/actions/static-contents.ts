import { staticContentsRepository } from "@/features/contents/repositories/static-contents-repository";

export const getAllStaticContents = staticContentsRepository.findAll;

export const getStaticContentsCount = staticContentsRepository.count;
