export const PAGE_NAME = "s-private";

export const PAGE_SIZE = 12;

// NOTE: sync with s-contents/update-db.ts
export const ORIGINAL_IMAGE_PATH = "images/original";
export const THUMBNAIL_IMAGE_PATH = "images/thumbnail";
export const THUMBNAIL_WIDTH = 192;
export const THUMBNAIL_HEIGHT = 192;

export const NOT_FOUND_IMAGE_PATH = "/not-found.png";

export const FORM_ERROR_MESSAGES = {
	REQUIRED: "必須項目です。",
	TOO_LONG: "文字数が多すぎます。",
	ALPHABET_ONLY: "アルファベットとハイフンのみが入力可能です。",
	INVALID_FORMAT: "無効なフォーマットで入力されています。",
	INVALID_FILE_FORMAT: "ファイルのフォーマットが無効です。",
} as const;

export const ERROR_MESSAGES = {
	UNEXPECTED: "予期せぬエラーが発生しました。",
	LINE_SEND: "ログの送信でエラーが発生しました。",
	PRISMA_DUPLICATE: "すでに登録されているため登録できません。",
	PRISMA_UNEXPECTED: "データベースへの書き込み時にエラーが発生しました。",
	UNAUTHORIZED: "認証されていません。",
	NOT_ALLOWED: "操作が許可されていません。",
	SIGN_IN: "メールアドレスまたはパスワードが間違っています。",
	SIGN_IN_UNKNOWN: "サインインに失敗しました。",
} as const;

export const SUCCESS_MESSAGES = {
	INSERTED: "正常に登録されました。",
	SIGN_IN: "サインインに成功しました。",
	SIGN_OUT: "サインアウトに成功しました。",
	UPDATE: "更新が完了しました。",
} as const;

export const SKELETON_STACK_SIZE = 10;

export const DEFAULT_SIGN_IN_REDIRECT = "/";
export const DEFAULT_SIGN_OUT_REDIRECT = "/auth";

export const UTIL_URLS = [
	{ name: "NEWS", url: "https://s-hirano.com/news" },
	{ name: "SUMMARY", url: "https://s-hirano.com/summary" },
	{ name: "BOOK", url: "https://s-hirano.com/book" },
	{ name: "BLOG", url: "https://s-hirano.com/blog" },
	{ name: "PORTAINER", url: "https://private.s-hirano.com:9443" },
	{ name: "GRAFANA", url: "https://private.s-hirano.com:3001" },
] as const;
