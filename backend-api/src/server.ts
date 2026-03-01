import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { app } from "./app";
import { ensureDefaultAdmin } from "./utils/bootstrap-admin";

const start = async () => {
  try {
    await prisma.$connect();
    const admin = await ensureDefaultAdmin();
    // eslint-disable-next-line no-console
    console.log(`Default admin available: ${admin.email}`);
    app.listen(env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`API running on port ${env.PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
