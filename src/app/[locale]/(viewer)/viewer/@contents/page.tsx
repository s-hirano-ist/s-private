import { ContentsCounter } from "./_contents-counter/server";
import { ContentsStack } from "./_contents-stack/server";

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
	const activeTab = (await searchParams).tab as string;

	// Only render if this tab is active
	if (activeTab && activeTab !== "contents") {
		return <div />;
	}

	return (
		<>
			<ContentsCounter />
			<ContentsStack />
		</>
	);
}
