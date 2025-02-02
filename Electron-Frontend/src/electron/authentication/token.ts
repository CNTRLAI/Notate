import jwt from "jsonwebtoken";
import { getSecret } from "./secret.js";

export async function getToken({ userId }: { userId: string }) {
  return jwt.sign({ userId }, getSecret(), {
    algorithm: "HS256",
  });
}
