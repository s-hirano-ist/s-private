import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "s-private",
		short_name: "s-private",
		description: "Dumper and Viewer of s-hirano-ist's memories.",
		lang: "ja",
		start_url: "/",
		theme_color: "#fff",
		background_color: "#000",
		icons: [{ src: "/favicon.ico", sizes: "any" }],
		display: "fullscreen",
	};
}
