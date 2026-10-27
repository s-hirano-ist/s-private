import type { Config } from "tailwindcss";

const config = {
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			typography: () => ({
				DEFAULT: {
					css: { a: { wordBreak: "break-all", overflowWrap: "break-word" } },
				},
			}),
			borderRadius: {
				lg: "var(--sui-radius)",
				md: "calc(var(--sui-radius) - 2px)",
				sm: "calc(var(--sui-radius) - 4px)",
			},
			keyframes: {
				"bg-position": {
					"0%": { backgroundPosition: "0% 50%" },
					"100%": { backgroundPosition: "100% 50%" },
				},
			},
		},
	},
} satisfies Config;

export default config;
