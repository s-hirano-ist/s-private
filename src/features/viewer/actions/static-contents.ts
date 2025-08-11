import { staticContentsRepository } from "@/features/viewer/repositories/static-contents-repository";

export const getAllStaticContents = staticContentsRepository.findAll;

export const getStaticContentsCount = staticContentsRepository.count;
