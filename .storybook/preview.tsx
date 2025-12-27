import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/nextjs-vite";
import "../packages/ui/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "../packages/ui/providers/theme-provider";

const preview = {
	decorators: [
		withThemeByClassName({
			themes: {
				light: "",
				dark: "dark",
			},
			defaultTheme: "light",
		}),
		(Story) => {
			return (
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem={false}
				>
					<NextIntlClientProvider
						locale="ja"
						messages={{
							utils: {
								signOut: "サインアウト",
								reload: "再読み込み",
							},
							label: {
								category: "カテゴリー",
								title: "タイトル",
								description: "ひとこと",
								url: "URL",
								save: "保存",
								upload: "アップロード",
								uploading: "アップロード中...",
								image: "画像",
								send: "送信",
								status: "状態",
								target: "ターゲット",
								dumpStatus: "DUMPの状態",
								dumpTarget: "DUMPのターゲット",
								totalBooks: "冊数",
								totalNotes: "ノート数",
								totalImages: "画像数",
								totalArticles: "ニュース総数",
								search: "検索",
								aiSearch: "AI知識検索",
								aiSearchDescription: "AI検索を使用してナレッジベースを検索",
								searching: "検索中...",
								score: "スコア",
								delete: "削除",
								cancel: "キャンセル",
								confirmDelete: "削除の確認",
								articles: "articles",
								notes: "notes",
								images: "images",
								resignIn: "再サインイン",
								noResults: "見つかりませんでした",
								searchPlaceholder: "検索...",
								useCustomValue: "「{value}」を使用",
								"403": "許可されていません",
							},
							statusCode: {
								"000": "近日公開",
								"204": "コンテンツがありません",
								"403": "許可されていません",
								"404": "コンテンツが見つかりません",
								"500": "予期せぬエラーが発生しました",
							},
							message: {
								inserted: "正常に登録されました。",
								success: "完了",
								updated: "更新が完了しました。",
								unexpected: "予期せぬエラーが発生しました。",
								pushoverSend: "ログの送信でエラーが発生しました。",
								duplicated: "すでに登録されているため登録できません。",
								prismaUnexpected:
									"データベースへの書き込み時にエラーが発生しました。",
								unauthorized: "認証されていません。",
								notAllowed: "操作が許可されていません。",
								signInUnknown: "サインインに失敗しました。",
								required: "必須項目です。",
								tooLong: "文字数が多すぎます。",
								invalidFormat: "無効なフォーマットで入力されています。",
								invalidFileFormat: "ファイルのフォーマットが無効です。",
								deleted: "正常に削除されました。",
								error: "エラーが発生しました。",
							},
						}}
					>
						<div className="w-96">
							<Story />
						</div>
					</NextIntlClientProvider>
				</ThemeProvider>
			);
		},
	],
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},

		nextjs: { appDirectory: true },

		docs: {
			codePanel: true,
		},

		// Backgrounds addon configuration
		backgrounds: {
			default: "white",
			values: [
				{
					name: "white",
					value: "#ffffff",
				},
				{
					name: "light",
					value: "#f8f9fa",
				},
				{
					name: "dark",
					value: "#343a40",
				},
				{
					name: "black",
					value: "#000000",
				},
			],
		},
		a11y: {
			// 'todo' - show a11y violations in the test UI only
			// 'error' - fail CI on a11y violations
			// 'off' - skip a11y checks entirely
			test: "todo",
		},
	},
} satisfies Preview;

export default preview;
