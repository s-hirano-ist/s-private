import * as categories from "@/backend/http/mobile/controllers/categories";
import * as content from "@/backend/http/mobile/controllers/content";
import * as detail from "@/backend/http/mobile/controllers/detail";
import * as manifest from "@/backend/http/mobile/controllers/manifest";
import * as media from "@/backend/http/mobile/controllers/media";
import * as search from "@/backend/http/mobile/controllers/search";
import * as syncChanges from "@/backend/http/mobile/controllers/sync-changes";
import * as syncHead from "@/backend/http/mobile/controllers/sync-head";
import * as syncSnapshot from "@/backend/http/mobile/controllers/sync-snapshot";
import * as upload from "@/backend/http/mobile/controllers/upload";
import * as uploadChunk from "@/backend/http/mobile/controllers/upload-chunk";
import * as uploadComplete from "@/backend/http/mobile/controllers/upload-complete";
import * as uploads from "@/backend/http/mobile/controllers/uploads";

export const mobileControllers = {
	content,
	detail,
	categories,
	manifest,
	search,
	syncHead,
	syncSnapshot,
	syncChanges,
	uploads,
	upload,
	uploadChunk,
	uploadComplete,
	media,
};
