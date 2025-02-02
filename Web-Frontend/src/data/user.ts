"use server";

import db from "@/src/lib/db";

export const createUser = async (
  email: string,
  password: string,
  name: string,
  username: string
) => {
  try {
    // First create the base user
    const createdUser = await db.users.create({
      data: {
        name,
        created_at: new Date(),
      },
    });

    if (!createdUser) {
      throw new Error("Failed to create base user");
    }

    // Then create the web user with the reference
    const webUser = await db.web_user.create({
      data: {
        email,
        password,
        username,
        user_id: createdUser.id,
      },
    });

    return webUser;
  } catch (e) {
    console.error("Error creating user:", e);
    return null;
  }
};

export const getUserByEmail = async (email: string) => {
  if (!email) {
    return null;
  }

  try {
    const user = await db.web_user.findUnique({
      where: {
        email: email,
      },
    });
    return user;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error getting user by email:", error.message);
    } else {
      console.error("Unknown error getting user by email");
    }
    return null;
  }
};

export const getUserRoleAndAccountType = async (userId: number) => {
  try {
    return await db.web_user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
        user_id: true,
      },
    });
  } catch (e) {
    console.error(e);
    return null;
  }
};
