export const PAGE_NAME = "s-private";

export const PAGE_SIZE = 12;

// NOTE: sync with s-contents/update-db.ts
export const ORIGINAL_IMAGE_PATH = "images/original";
export const THUMBNAIL_IMAGE_PATH = "images/thumbnail";
export const THUMBNAIL_WIDTH = 192;
export const THUMBNAIL_HEIGHT = 192;

export const NOT_FOUND_IMAGE_PATH = "/not-found.png";

export const SKELETON_STACK_SIZE = 10;

export const UTIL_URLS = [
	{ name: "NEWS", url: "https://s-hirano.com/news" },
	{ name: "SUMMARY", url: "https://s-hirano.com/summary" },
	{ name: "BOOK", url: "https://s-hirano.com/book" },
	{ name: "BLOG", url: "https://s-hirano.com/blog" },
	{ name: "PORTAINER", url: "https://private.s-hirano.com:9443" },
	{ name: "GRAFANA", url: "https://private.s-hirano.com:3001" },
	{ name: "STORYBOOK", url: "https://private.s-hirano.com:6006" },
	{ name: "MINIO", url: "https://private.s-hirano.com:9001" },
	//TODO: { name: "ADMINJS", url: "https://private.s-hirano.com:XXXX" },
] as const;
