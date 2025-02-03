import jwt from "jsonwebtoken";
import { getSecret } from "./secret";

export async function getToken({ userId }: { userId: string }) {
  return jwt.sign({ userId }, getSecret(), {
    algorithm: "HS256",
  });
}
