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
    console.log("Creating user");
    // First create the base user
    console.log("Creating base user", name);
    const createdUser = await db.users.create({
      data: {
        name,
      },
    });

    // Then create the web user if we have web credentials
    if (email && password && username) {
      console.log("Creating web user");
      const webUser = await db.web_user.create({
        data: {
          email,
          password,
          username,
          user_id: createdUser.id,
        },
      });

      return webUser;
    }

    return null;
  } catch (error) {
    // Log the error stack instead of the error object directly
    if (error instanceof Error) {
      console.error("Error in user creation process - Stack:", error.stack);
      throw new Error(`Failed to create user: ${error.message}`);
    } else {
      console.error("Unknown error in user creation process");
      throw new Error("Failed to create user: Unknown error");
    }
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
    // Log the error stack instead of the error object directly
    if (error instanceof Error) {
      console.error("Error in user creation process - Stack:", error.stack);
      throw new Error(`Failed to create user: ${error.message}`);
    } else {
      console.error("Unknown error in user creation process");
      throw new Error("Failed to create user: Unknown error");
    }
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
  } catch (error) {
    // Log the error stack instead of the error object directly
    if (error instanceof Error) {
      console.error("Error in user creation process - Stack:", error.stack);
      throw new Error(`Failed to create user: ${error.message}`);
    } else {
      console.error("Unknown error in user creation process");
      throw new Error("Failed to create user: Unknown error");
    }
    return null;
  }
};

export const getUserByWebId = async (userId: number) => {
  console.log("Getting user by id", userId);
  try {
    const user = await db.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
      },
    });
    console.log("User found", user);
    if (!user) return null;

    return {
      name: user?.name,
      id: user?.id,
    };
  } catch (error) {
    // Log the error stack instead of the error object directly
    if (error instanceof Error) {
      console.error("Error in user creation process - Stack:", error.stack);
      throw new Error(`Failed to create user: ${error.message}`);
    } else {
      console.error("Unknown error in user creation process");
      throw new Error("Failed to create user: Unknown error");
    }
    return null;
  }
};
