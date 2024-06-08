"use client";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueueTable } from "@/features/blog/components/queue-table";
import { GitHubLogoIcon, PlusIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useFormState } from "react-dom";
import { submitBlog } from "../actions/submit";
import { DoneTable } from "./done-table";
import { NewInput } from "./new-input";

// TODO: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations

const initialState = "";

export function MainTab() {
	const [state, formAction] = useFormState(submitBlog, initialState);

	return (
		<div>
			<Tabs defaultValue="queue">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="queue">Queue</TabsTrigger>
					<TabsTrigger value="done">Done</TabsTrigger>
				</TabsList>
				<TabsContent value="queue">
					<Card>
						<CardHeader>
							<CardTitle>登録待ち</CardTitle>
							<CardDescription>
								localのGitに登録待ち状態のデータを表示しています。
							</CardDescription>
						</CardHeader>
						<CardContent>
							<QueueTable />
						</CardContent>
						<CardFooter>
							<Button>更新</Button>
						</CardFooter>
					</Card>
				</TabsContent>
				<TabsContent value="done">
					<Card>
						<CardHeader>
							<CardTitle>登録完了</CardTitle>
							<CardDescription>
								localのGitに登録完了したデータを表示しています。
							</CardDescription>
						</CardHeader>
						<CardContent>
							<DoneTable />
						</CardContent>
						<CardFooter>
							<Button>更新</Button>
						</CardFooter>
					</Card>
				</TabsContent>
			</Tabs>
			<Drawer>
				<div className="grid grid-cols-2 gap-4 py-4">
					<DrawerTrigger asChild>
						<Button variant="outline">
							<PlusIcon />
						</Button>
					</DrawerTrigger>
					<Link href={process.env.GITHUB_LINK ?? ""} target="_blank">
						<Button variant="outline" className="w-full">
							<GitHubLogoIcon />
						</Button>
					</Link>
				</div>
				<DrawerContent>
					<form action={formAction}>
						<div className="mx-auto w-full max-w-sm">
							<DrawerHeader>
								<DrawerTitle>新規登録</DrawerTitle>
								<DrawerDescription>
									ブログに登録するデータを入力してください。
								</DrawerDescription>
							</DrawerHeader>

							<div className="p-4 pb-0">
								<div className="flex items-center justify-center space-x-2">
									<NewInput />
									{/* FIXME: エラーハンドリング+エラー表示 server side sanitize */}
									{state}
								</div>
							</div>
							<DrawerFooter>
								<SubmitButton label="保存" />
								<DrawerClose asChild>
									<Button variant="outline">Cancel</Button>
								</DrawerClose>
							</DrawerFooter>
						</div>
					</form>
				</DrawerContent>
			</Drawer>
		</div>
	);
}
