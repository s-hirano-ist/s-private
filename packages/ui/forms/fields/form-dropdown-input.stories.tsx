import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormDropdownInput } from "./form-dropdown-input";

const meta = {
	component: FormDropdownInput,
	parameters: { layout: "centered", a11y: { test: "todo" } },
	argTypes: {
		label: { control: { type: "text" } },
		htmlFor: { control: { type: "text" } },
		name: { control: { type: "text" } },
		placeholder: { control: { type: "text" } },
		required: { control: { type: "boolean" } },
		disabled: { control: { type: "boolean" } },
		emptyMessage: { control: { type: "text" } },
		searchPlaceholder: { control: { type: "text" } },
		customValueLabel: { control: false },
	},
	decorators: [
		(Story) => (
			<div className="w-80">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof FormDropdownInput>;

export default meta;

type Story = StoryObj<typeof meta>;

const mockCategories = [
	{ id: "1", name: "テクノロジー" },
	{ id: "2", name: "ビジネス" },
	{ id: "3", name: "デザイン" },
	{ id: "4", name: "プログラミング" },
	{ id: "5", name: "ライフスタイル" },
];

const mockTags = [
	{ id: "1", name: "React" },
	{ id: "2", name: "TypeScript" },
	{ id: "3", name: "Next.js" },
	{ id: "4", name: "Storybook" },
	{ id: "5", name: "TailwindCSS" },
];

const mockFolders = [
	{ id: "1", name: "プロジェクト" },
	{ id: "2", name: "ドキュメント" },
	{ id: "3", name: "リソース" },
	{ id: "4", name: "アーカイブ" },
];

export const Default: Story = {
	args: {
		label: "カテゴリー",
		htmlFor: "category",
		name: "category",
		placeholder: "カテゴリーを選択または入力",
		options: mockCategories,
		required: true,
	},
};

export const Tags: Story = {
	args: {
		label: "タグ",
		htmlFor: "tag",
		name: "tag",
		placeholder: "タグを選択または入力",
		options: mockTags,
	},
};

export const Folders: Story = {
	args: {
		label: "フォルダー",
		htmlFor: "folder",
		name: "folder",
		placeholder: "保存先フォルダーを選択",
		options: mockFolders,
		required: true,
	},
};

export const EmptyOptions: Story = {
	args: {
		label: "空のオプション",
		htmlFor: "empty",
		name: "empty",
		placeholder: "オプションがありません",
		options: [],
		emptyMessage: "オプションがありません",
	},
};

export const Disabled: Story = {
	args: {
		label: "無効化されたドロップダウン",
		htmlFor: "disabled",
		name: "disabled",
		placeholder: "選択できません",
		options: mockCategories,
		disabled: true,
	},
};

export const LongOptionNames: Story = {
	args: {
		label: "長い名前のオプション",
		htmlFor: "long-names",
		name: "long-names",
		placeholder: "カテゴリーを選択",
		options: [
			{
				id: "1",
				name: "非常に長いカテゴリー名の例：フロントエンド開発とUI/UXデザイン",
			},
			{ id: "2", name: "バックエンド開発とデータベース設計・最適化" },
			{ id: "3", name: "モバイルアプリケーション開発（iOS・Android対応）" },
		],
	},
};

export const ManyOptions: Story = {
	args: {
		label: "多数のオプション（スクロールテスト）",
		htmlFor: "many-options",
		name: "many-options",
		placeholder: "オプションを選択",
		options: Array.from({ length: 25 }, (_, i) => ({
			id: String(i + 1),
			name: `オプション ${i + 1}`,
		})),
	},
};

export const CustomSearchPlaceholder: Story = {
	args: {
		label: "カスタム検索プレースホルダー",
		htmlFor: "custom-search",
		name: "custom-search",
		placeholder: "選択してください",
		options: mockCategories,
		searchPlaceholder: "カテゴリーを検索...",
		emptyMessage: "該当するカテゴリーがありません",
	},
};

export const JapaneseLabels: Story = {
	args: {
		label: "カテゴリー",
		htmlFor: "japanese",
		name: "japanese",
		placeholder: "カテゴリーを選択",
		options: mockCategories,
		searchPlaceholder: "検索...",
		emptyMessage: "見つかりませんでした",
		customValueLabel: (value) => `「${value}」を使用`,
	},
};
