import { forbidden } from "next/navigation";
import { AiSearchPage } from "@/features/ai/components/ai-search-page";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";

export default async function Page() {
	// Check if user has admin permission
	const hasAdminPermission = await hasViewerAdminPermission();

	// If not authenticated, show unauthorized component
	if (!hasAdminPermission) forbidden();

	// If authenticated, show AI search page
	return <AiSearchPage />;
}
