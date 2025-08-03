type Action = {
	message: string;
	success: boolean;
};

export type ServerAction<T> =
	| (Action & { data: T; success: true })
	| (Action & { success: false });

export type ContentName = "NEWS" | "CONTENTS" | "IMAGES";

export type Status = {
	exported: number;
	recentlyUpdated: number;
	unexported: number;
};

export type UpdateOrRevert = "UPDATE" | "REVERT";
