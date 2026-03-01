process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/kyc_admin";
process.env.JWT_SECRET = "supersecuresecretkey";
process.env.WEBHOOK_SECRET = "webhooksecret";
process.env.BCRYPT_ROUNDS = "4";

import { comparePassword, hashPassword, signToken, verifyToken } from "../utils/auth";

describe("auth utils", () => {
  it("hashes and compares password", async () => {
    const hash = await hashPassword("Password123");
    const isValid = await comparePassword("Password123", hash);
    const isInvalid = await comparePassword("WrongPassword", hash);

    expect(isValid).toBe(true);
    expect(isInvalid).toBe(false);
  });

  it("signs and verifies jwt token", () => {
    const token = signToken({ id: "user_1", role: "ADMIN" });
    const decoded = verifyToken(token);

    expect(decoded.id).toBe("user_1");
    expect(decoded.role).toBe("ADMIN");
  });
});
