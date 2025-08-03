"use server";

import { fetchAllKnowledge } from "./fetch-knowledge";

// Define the type for search results
export type SearchResult = {
	aiSummary: string;
	href: string;
	content: string;
	id: string;
	relevanceScore: number;
	title: string;
	type: "content" | "book";
};

// Simple text-based search function (fallback when no AI is available)
function simpleSearch(
	query: string,
	knowledgeBase: Awaited<ReturnType<typeof fetchAllKnowledge>>,
) {
	const normalizedQuery = query.toLowerCase();

	return knowledgeBase
		.filter((item) => {
			// Check if the query appears in the title or content
			return (
				item.title.toLowerCase().includes(normalizedQuery) ||
				item.content.toLowerCase().includes(normalizedQuery)
			);
		})
		.map((item) => {
			// Calculate a simple relevance score
			const titleMatches = (
				item.title.toLowerCase().match(new RegExp(normalizedQuery, "g")) || []
			).length;
			const contentMatches = (
				item.content.toLowerCase().match(new RegExp(normalizedQuery, "g")) || []
			).length;
			const relevanceScore = titleMatches * 3 + contentMatches;

			// Extract a snippet of content around the query
			let aiSummary = "";
			const contentLower = item.content.toLowerCase();
			const queryIndex = contentLower.indexOf(normalizedQuery);

			if (contentLower.includes(normalizedQuery)) {
				// Extract text around the query match
				const startIndex = Math.max(0, queryIndex - 100);
				const endIndex = Math.min(
					item.content.length,
					queryIndex + normalizedQuery.length + 100,
				);
				aiSummary = item.content.slice(startIndex, endIndex);

				// Add ellipsis if we're not at the beginning or end
				if (startIndex > 0) aiSummary = "..." + aiSummary;
				if (endIndex < item.content.length) aiSummary = aiSummary + "...";
			} else {
				// If no direct match, just take the first part of the content
				aiSummary = item.content.slice(0, 200) + "...";
			}

			return {
				...item,
				relevanceScore,
				aiSummary,
			};
		})
		.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Main search function that will be called from the client
export async function searchKnowledge(query: string): Promise<SearchResult[]> {
	if (!query.trim()) {
		return [];
	}

	try {
		// Fetch all knowledge
		const knowledgeBase = await fetchAllKnowledge();

		// For now, use the simple search as we don't have an LLM integrated yet
		// In a production environment, this would be replaced with a call to an LLM API
		const results = simpleSearch(query, knowledgeBase);

		return results;
	} catch (error) {
		console.error("Error searching knowledge:", error);
		return [];
	}
}

// Function to get a specific item by ID
export async function getKnowledgeItemById(id: string) {
	const knowledgeBase = await fetchAllKnowledge();
	return knowledgeBase.find((item) => item.id === id);
}
