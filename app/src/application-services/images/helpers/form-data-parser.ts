import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { getFormDataFile } from "@/common/utils/form-data-utils";
import { parseImageInput } from "@s-hirano-ist/s-backend/images/input";
export const parseAddImageFormData = async (
	formData: FormData,
	userId: UserId,
) => await parseImageInput(getFormDataFile(formData, "file"), userId);
