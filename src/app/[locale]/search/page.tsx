import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { SimpleSearch } from "./simple-search/server";

export default async function Page() {
	const hasAdminPermission = await hasViewerAdminPermission();

	if (!hasAdminPermission) forbidden();

	return <SimpleSearch />;
}
