import { withRelatedProject } from "@vercel/related-projects";

/** Use the matching backend branch on Vercel Preview; keep explicit origins elsewhere. */
export function resolveBackendUrl(settings: {
	backendUrl?: string;
	vercel?: string;
	vercelEnv?: string;
}): string | undefined {
	if (settings.vercel === "1" && settings.vercelEnv === "preview") {
		return (
			withRelatedProject({
				projectName: "backend",
				defaultHost: settings.backendUrl ?? "",
			}) || undefined
		);
	}
	return settings.backendUrl;
}
