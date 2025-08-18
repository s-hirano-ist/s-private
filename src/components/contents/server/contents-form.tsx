import type { ServerAction } from "@/common/types";
import { ContentsFormClient } from "../client/contents-form-client";

type Props = {
	addContents: (formData: FormData) => Promise<ServerAction>;
};

export async function ContentsForm({ addContents }: Props) {
	return <ContentsFormClient addContents={addContents} />;
}
