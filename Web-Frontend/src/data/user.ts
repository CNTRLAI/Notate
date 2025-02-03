"use server";

import db from "@/src/lib/db";

export const createUser = async (
  email: string,
  password: string,
  name: string,
  username: string
) => {
  if (!email || !password || !name || !username) {
    throw new Error("Missing required fields");
  }

  try {
    // First create the base user
    const createdUser = await db.users.create({
      data: {
        name,
      },
    });

    try {
      // Create the web user with the reference
      const webUser = await db.web_user.create({
        data: {
          email,
          password,
          username,
          user_id: createdUser.id,
        },
      });

      return webUser;
    } catch (webUserError) {
      // If web user creation fails, clean up the base user
      console.error(
        "Error creating web user. Error details:",
        webUserError instanceof Error
          ? {
              name: webUserError.name,
              message: webUserError.message,
            }
          : "Unknown error"
      );

      await db.users
        .delete({
          where: { id: createdUser.id },
        })
        .catch((deleteError) => {
          console.error("Failed to clean up base user:", deleteError);
        });

      throw webUserError;
    }
  } catch (e) {
    console.error("Error in user creation process:", e);
    if (e instanceof Error) {
      throw new Error(`Failed to create user: ${e.message}`);
    }
    throw new Error("Failed to create user: Unknown error");
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
