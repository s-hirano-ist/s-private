import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "s-private",
		short_name: "s-private",
		description: "Dumper and Viewer of s-hirano-ist's memories.",
		lang: "ja",
		start_url: "/",
		theme_color: "#10182c",
		background_color: "#10182c",
		icons: [
			{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
			{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
		],
		display: "fullscreen",
	};
}
