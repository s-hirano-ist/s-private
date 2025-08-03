"use client";

import { Route } from "next";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { SearchResult } from "@/features/ai/actions/ai-search";
import { Link } from "@/i18n/routing";

type Props = {
	isLoading: boolean;
	results: SearchResult[];
};

export function SearchResults({ results, isLoading }: Props) {
	const t = useTranslations("label");

	if (isLoading) {
		return (
			<div className="mt-4">
				<p className="text-center text-muted-foreground">{t("searching")}</p>
			</div>
		);
	}

	if (results.length === 0) {
		return (
			<div className="mt-4">
				<p className="text-center text-muted-foreground">{t("noResults")}</p>
			</div>
		);
	}

	return (
		<div className="mt-4 space-y-4">
			{results.map((result) => (
				<Card className="overflow-hidden" key={result.id}>
					<CardHeader className="pb-2">
						<CardTitle className="text-lg">
							<Link
								className="text-primary-grad hover:underline"
								href={result.href as Route}
							>
								{result.title}
							</Link>
						</CardTitle>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<span className="capitalize">{result.type}</span>
							<span>•</span>
							<span>
								{t("score")}: {result.relevanceScore}
							</span>
						</div>
					</CardHeader>
					<Separator />
					<CardContent className="pt-4">
						<div className="prose prose-sm dark:prose-invert">
							<p>{result.aiSummary}</p>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
