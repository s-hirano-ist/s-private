import { searchKnowledge } from "@/features/ai/actions/ai-search";
import { SimpleSearchClient } from "./client";

export function SimpleSearch() {
	return <SimpleSearchClient searchKnowledge={searchKnowledge} />;
}
