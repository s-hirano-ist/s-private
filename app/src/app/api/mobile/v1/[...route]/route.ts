import { mobileControllers } from "@/backend/http/mobile/controllers";
import { createMobileApp } from "@/backend/http/mobile/router";

const app = createMobileApp(mobileControllers);
const handler = (request: Request) => app.fetch(request);
export {
	handler as GET,
	handler as POST,
	handler as PUT,
	handler as DELETE,
	handler as OPTIONS,
};
