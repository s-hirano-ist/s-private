import { cleanup, render } from "@testing-library/react";
import { afterEach, bench, describe, vi } from "vitest";
import { BaseCardStackWrapper } from "./base-card-stack";
import type { CardStackInitialData, LinkCardData } from "./types";

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));

function generateItems(count: number): LinkCardData[] {
	return Array.from({ length: count }, (_, i) => ({
		id: `id-${i}`,
		key: `key-${i}`,
		title: `Item ${i}`,
		description: `Description for item ${i}`,
		primaryBadgeText: "Badge",
		href: `/items/${i}`,
	}));
}

const items10 = generateItems(10);
const items100 = generateItems(100);

function makeInitial(data: LinkCardData[]): CardStackInitialData<LinkCardData> {
	return { data, totalCount: data.length };
}

const noopDelete = vi.fn();
const noopLoadMore = vi.fn();

function TestCardStack({
	initial,
}: {
	initial: CardStackInitialData<LinkCardData>;
}) {
	return (
		<BaseCardStackWrapper
			deleteAction={noopDelete}
			gridClassName="grid grid-cols-1 gap-4"
			initial={initial}
			loadMoreAction={noopLoadMore}
		>
			{({ item, itemKey }: { item: LinkCardData; itemKey: string }) => (
				<div key={itemKey}>{item.title}</div>
			)}
		</BaseCardStackWrapper>
	);
}

afterEach(() => {
	cleanup();
});

describe("BaseCardStack render benchmarks", () => {
	bench("initial render - 10 items", () => {
		const { unmount } = render(
			<TestCardStack initial={makeInitial(items10)} />,
		);
		unmount();
	});

	bench("initial render - 100 items", () => {
		const { unmount } = render(
			<TestCardStack initial={makeInitial(items100)} />,
		);
		unmount();
	});

	bench("re-render - 100 items", () => {
		const { rerender, unmount } = render(
			<TestCardStack initial={makeInitial(items100)} />,
		);
		rerender(<TestCardStack initial={makeInitial(items100)} />);
		unmount();
	});
});
