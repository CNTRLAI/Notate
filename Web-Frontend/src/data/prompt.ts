"use server";
import db from "@/src/lib/db";

export const getPrompts = async (userId: number) => {
  const prompts = await db.prompts.findMany({
    where: {
      user_id: userId,
    },
  });
  return prompts;
};
