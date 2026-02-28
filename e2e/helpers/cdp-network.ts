import type { Page } from "@playwright/test";

type NetworkConditions = {
	offline: boolean;
	downloadThroughput: number;
	uploadThroughput: number;
	latency: number;
};

const PRESETS = {
	slow3G: {
		offline: false,
		downloadThroughput: (500 * 1024) / 8,
		uploadThroughput: (500 * 1024) / 8,
		latency: 400,
	},
	offline: {
		offline: true,
		downloadThroughput: 0,
		uploadThroughput: 0,
		latency: 0,
	},
	fast: {
		offline: false,
		downloadThroughput: -1,
		uploadThroughput: -1,
		latency: 0,
	},
} as const satisfies Record<string, NetworkConditions>;

type Preset = keyof typeof PRESETS;

async function getCDPSession(page: Page) {
	return page.context().newCDPSession(page);
}

export async function setNetworkConditions(page: Page, preset: Preset) {
	const cdp = await getCDPSession(page);
	await cdp.send("Network.emulateNetworkConditions", PRESETS[preset]);
	return cdp;
}

export async function resetNetwork(page: Page) {
	const cdp = await getCDPSession(page);
	await cdp.send("Network.emulateNetworkConditions", PRESETS.fast);
	return cdp;
}
