import { atom } from "recoil";

export type NewsContext = {
	id: number;
	title: string;
	quote: string | null;
	url: string;
	category: string;
};

export const newsContext = atom<NewsContext[] | undefined>({
	key: "news",
	default: undefined,
});
