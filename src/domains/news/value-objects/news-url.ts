import { z } from "zod";
import { createBrandedType } from "@/domains/common/value-objects";

const isValidUrl = (url: string) => {
	try {
		const urlObject = new URL(url);
		return urlObject.protocol === "http:" || urlObject.protocol === "https:";
	} catch {
		return false;
	}
};

const newsUrlSchema = z
	.string()
	.min(1, "URL is required")
	.url("Invalid URL format")
	.refine((url) => isValidUrl(url), "URL must use HTTP or HTTPS protocol")
	.refine((url) => {
		const urlObject = new URL(url);
		return urlObject.hostname.length > 0;
	}, "URL must have a valid hostname");

export const NewsUrl = createBrandedType("NewsUrl", newsUrlSchema);
export type NewsUrl = ReturnType<typeof NewsUrl.create>;

export const newsUrlValidationRules = {
	isValidProtocol: (url: string): boolean => {
		try {
			const urlObject = new URL(url);
			return urlObject.protocol === "http:" || urlObject.protocol === "https:";
		} catch {
			return false;
		}
	},

	extractDomain: (url: NewsUrl): string => {
		const urlString = NewsUrl.unwrap(url);
		try {
			return new URL(urlString).hostname;
		} catch {
			return "";
		}
	},

	normalize: (url: string): string => {
		try {
			const urlObject = new URL(url.trim());
			// Remove trailing slash from pathname if it's just "/"
			if (
				urlObject.pathname === "/" &&
				urlObject.search === "" &&
				urlObject.hash === ""
			) {
				urlObject.pathname = "";
			}
			return urlObject.toString();
		} catch {
			return url.trim();
		}
	},

	isSameDomain: (url1: NewsUrl, url2: NewsUrl): boolean => {
		const domain1 = newsUrlValidationRules.extractDomain(url1);
		const domain2 = newsUrlValidationRules.extractDomain(url2);
		return domain1 === domain2;
	},
} as const;
