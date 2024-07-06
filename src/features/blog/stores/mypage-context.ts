import { atom } from "recoil";

export type MypageContext = {
	id: number;
	title: string;
	quote: string;
	url: string;
};

export const mypageContext = atom<MypageContext[]>({
	key: "mypage",
	default: [],
});
