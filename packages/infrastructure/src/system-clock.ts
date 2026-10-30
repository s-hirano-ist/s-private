import type { Clock } from "@s-hirano-ist/s-application/clock";
export const systemClock: Clock = { now: () => new Date() };
