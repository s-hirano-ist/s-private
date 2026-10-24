import { auth } from "@/infrastructures/auth/auth";

export const GET = (request: Request) => auth.handler(request);
export const POST = GET;
