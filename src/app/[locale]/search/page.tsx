import { StatusCodeView } from "@/components/card/status-code-view";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export default function Page() {
	return <StatusCodeView statusCode="000" />;
}
