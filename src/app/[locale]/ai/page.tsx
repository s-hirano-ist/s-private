import { forbidden } from "next/navigation";
import { AiSearchPage } from "@/features/ai/components/ai-search-page";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";

export default async function Page() {
	const hasAdminPermission = await hasViewerAdminPermission();

	if (!hasAdminPermission) forbidden();

	return <AiSearchPage />;
}
