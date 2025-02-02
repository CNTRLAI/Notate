"use server";
import * as z from "zod";
import { RegisterSchema } from "@/src/schemas/registerSchema";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail } from "@/src/data/user";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validateFields = RegisterSchema.safeParse(values) as {
    success: boolean;
    data: { email: string; password: string; name: string; username: string };
  };
  if (!validateFields.success) {
    return { error: "Invalid fields" };
  }
  const { email, password, name, username } = validateFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { error: "User already exists" };
    }
    const inputUser = await createUser(email, hashedPassword, name, username);

    if (!inputUser) {
      return { error: "Error creating user" };
    }

    return { success: "User created", user: inputUser };
  } catch (error) {
    console.error(error);
    return { error: "Error creating user" };
  }
};
