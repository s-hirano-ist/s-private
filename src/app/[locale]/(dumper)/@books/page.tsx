import { BooksCounter } from "./_books-counter/server";
import { BooksStack } from "./_books-stack/server";

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
	const activeTab = (await searchParams).tab as string;

	// Only render if this tab is active
	if (activeTab && activeTab !== "books") {
		return <div />;
	}

	return (
		<>
			<BooksCounter />
			<BooksStack />;
		</>
	);
}
