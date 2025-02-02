import { z } from "zod";
export const RegisterSchema = z.object({
  email: z.string().email("Email is required"),
  password: z.string().min(8, "Password is required"),
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
});
