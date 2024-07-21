"use client";
import { Button } from "@/components/ui/button";
import {
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { changeBlogStatus } from "@/features/blog/actions/change-blog-status";
import { useToast } from "@/hooks/use-toast";
import { Link } from "next-view-transitions";
import { type Dispatch, type SetStateAction, useState } from "react";
import { changeMypageStatus } from "../../mypage/actions/change-mypage-status";

type Props = {
	setOpen: Dispatch<SetStateAction<boolean>>;
};

export function SubmitDrawer({ setOpen }: Props) {
	const { toast } = useToast();

	const [buttonDisabled, setButtonDisabled] = useState(false);

	const handleBlogUpdateStatus = async () => {
		setButtonDisabled(true);
		setOpen(false);
		const state = await changeBlogStatus("UPDATE");
		toast({
			variant: state.success ? "default" : "destructive",
			description: state.message,
		});
		setButtonDisabled(false);
	};

	const handleBlogRevertStatus = async () => {
		setButtonDisabled(true);
		setOpen(false);
		const state = await changeBlogStatus("REVERT");
		toast({
			variant: state.success ? "default" : "destructive",
			description: state.message,
		});
		setButtonDisabled(false);
	};

	const handleMypageUpdateStatus = async () => {
		setButtonDisabled(true);
		setOpen(false);
		const state = await changeMypageStatus("UPDATE");
		toast({
			variant: state.success ? "default" : "destructive",
			description: state.message,
		});
		setButtonDisabled(false);
	};

	const handleMypageRevertStatus = async () => {
		setButtonDisabled(true);
		setOpen(false);
		const state = await changeMypageStatus("REVERT");
		toast({
			variant: state.success ? "default" : "destructive",
			description: state.message,
		});
		setButtonDisabled(false);
	};
	return (
		<>
			<DrawerHeader>
				<DrawerTitle>アクション</DrawerTitle>
				<DrawerDescription>
					実行するアクションを選択してください。
				</DrawerDescription>
			</DrawerHeader>
			<div className="grid grid-cols-2 gap-4 px-4">
				<Button onClick={handleBlogUpdateStatus} disabled={buttonDisabled}>
					BLOG UPDATE
				</Button>
				<Button onClick={handleBlogRevertStatus} disabled={buttonDisabled}>
					BLOG REVERT
				</Button>
				<Button onClick={handleMypageUpdateStatus} disabled={buttonDisabled}>
					MYPAGE UPDATE
				</Button>
				<Button onClick={handleMypageRevertStatus} disabled={buttonDisabled}>
					MYPAGE REVERT
				</Button>
			</div>
			<Link href="/dump" className="p-4">
				<Button className="w-full">全dumpデータ</Button>
			</Link>
		</>
	);
}
