const TOKYO_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
	day: "2-digit",
	month: "2-digit",
	timeZone: "Asia/Tokyo",
	year: "numeric",
});

export type GigazineHeadline = {
	date: string;
	payload: {
		body: string;
		icon: string;
		tag: string;
		title: string;
		url: string;
	};
};

export function buildGigazineHeadline(now = new Date()): GigazineHeadline {
	const parts = Object.fromEntries(
		TOKYO_DATE_FORMATTER.formatToParts(now).map(({ type, value }) => [
			type,
			value,
		]),
	);
	const target = new Date(
		Date.UTC(
			Number(parts.year),
			Number(parts.month) - 1,
			Number(parts.day) - 2,
		),
	);
	const date = [
		target.getUTCFullYear(),
		String(target.getUTCMonth() + 1).padStart(2, "0"),
		String(target.getUTCDate()).padStart(2, "0"),
	].join("");
	const url = `https://gigazine.net/news/${date}-headline`;

	return {
		date,
		payload: {
			body: url,
			icon: "/apple-icon.png",
			tag: `gigazine-headline-${date}`,
			title: `Gigazine news for ${date}`,
			url,
		},
	};
}
