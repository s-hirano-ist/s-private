import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/infrastructures/auth/auth";

export const { GET, POST } = toNextJsHandler(auth);
