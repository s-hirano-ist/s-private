import { StatusCodeView } from "@/components/status/status-code-view";

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
	const activeTab = (await searchParams).tab as string;

	// Only render if this tab is active
	if (activeTab && activeTab !== "books") {
		return <div />;
	}

	return <StatusCodeView statusCode="000" />;
}
