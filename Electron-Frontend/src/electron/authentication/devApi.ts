import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { app } from "electron";
import crypto from "crypto";
import { isDev } from "../util.js";

export function getDevSecretPath(): string {
  const secretFileName = ".dev.secret";
  return isDev()
    ? path.join(process.cwd(), "..", secretFileName)
    : path.join(app.getPath("userData"), secretFileName);
}

export function getSecret(): string {
  const secretPath = getDevSecretPath();

  try {
    // Try to read existing secret
    if (fs.existsSync(secretPath)) {
      return fs.readFileSync(secretPath, "utf8").trim();
    }

    // Generate new secret if none exists
    const secret = crypto.randomBytes(32).toString("base64");
    fs.writeFileSync(secretPath, secret);
    return secret;
  } catch (error) {
    console.error("Error handling dev API secret:", error);
    return crypto.randomBytes(32).toString("base64"); // Fallback to memory-only secret
  }
}

export async function getDevApiKey({
  userId,
  expiration,
}: {
  userId: string;
  expiration: string | null;
}) {
  const secret = getSecret();
  return jwt.sign({ userId, expiration }, secret, {
    algorithm: "HS256",
  });
}
