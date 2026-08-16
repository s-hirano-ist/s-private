import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing-config";

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect } = createNavigation(routing);
