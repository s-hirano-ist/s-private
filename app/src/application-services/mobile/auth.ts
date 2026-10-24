import "server-only";
import type { MobileDeps } from "@s-hirano-ist/s-backend/mobile/deps";
import { defaultMobileDeps } from "@/application-services/mobile/deps";
import { env } from "@/env";
import {
	authenticateMobileRequest as authenticate,
	withMobileTenant as withTenant,
} from "@s-hirano-ist/s-backend/auth/mobile-auth";
export { MobileApiError } from "@s-hirano-ist/s-backend/mobile/error";
export { verifyMobileToken } from "@s-hirano-ist/s-backend/auth/mobile-auth";
export const authenticateMobileRequest = (
	request: Request,
	deps: Pick<MobileDeps, "accounts"> = defaultMobileDeps,
) => authenticate(request, env, deps);
export const withMobileTenant = <T>(
	request: Request,
	fn: (userId: string) => Promise<T>,
): Promise<T> => withTenant(request, fn, env, defaultMobileDeps);
