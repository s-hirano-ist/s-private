"use client";
import { ContentPreview } from "./content-preview";

type Props = { path: string; data: Record<string, string> };

export function ContentStack({ path, data }: Props) {
	return (
		<div className="my-2 grid grid-cols-2 items-stretch gap-4 px-2 sm:grid-cols-4">
			{Object.entries(data).map(([key, value]) => {
				return (
					<div key={key}>
						<ContentPreview path={path} slug={key} imagePath={value} />
					</div>
				);
			})}
		</div>
	);
}
