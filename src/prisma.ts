// In case of error of prisma on development environment
// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices

import { PrismaClient } from "@prisma/client";
// import { PrismaClient } from '@prisma/client/edge' // FIXME: for edge
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient({
	omit: { users: { password: true } },
}).$extends(withAccelerate());
export default prisma;
