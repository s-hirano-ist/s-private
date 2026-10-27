import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Route } from "next";
import { NotFound } from "./not-found";

const meta = {
	component: NotFound,
	parameters: { layout: "centered" },
} satisfies Meta<typeof NotFound>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: "コンテンツが見つかりません",
		returnHomeText: "ホームに戻る",
		// oxlint-disable-next-line typescript/no-unnecessary-type-assertion -- Storybook args need to satisfy the Route prop used by Next typed routes.
		returnHomeHref: "/ja" as Route,
	},
};
