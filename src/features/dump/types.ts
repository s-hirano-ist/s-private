export type ContentName = "NEWS" | "CONTENTS" | "IMAGES";

export type Status = {
	exported: number;
	recentlyUpdated: number;
	unexported: number;
};

export type UpdateOrRevert = "UPDATE" | "REVERT";
