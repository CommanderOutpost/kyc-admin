process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/kyc_admin";
process.env.JWT_SECRET = "supersecuresecretkey";
process.env.WEBHOOK_SECRET = "webhooksecret";
process.env.BCRYPT_ROUNDS = "4";

import { login } from "../controllers/auth.controller";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";

jest.mock("../config/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    }
  }
}));

describe("auth controller", () => {
  it("throws for invalid credentials", async () => {
    const req = { body: { email: "user@example.com", password: "Password123" } } as any;
    const res = {} as any;

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(login(req, res)).rejects.toBeInstanceOf(AppError);
  });
});
