export function formatSlugsAndImages(slugs: string[], images: string[]) {
	return slugs.reduce(
		(acc, key, index) => {
			acc[key] = images[index];
			return acc;
		},
		{} as Record<string, string>,
	);
}
