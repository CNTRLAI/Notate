import db from "@/src/lib/db";

export const getSystemTools = async () => {
  const tools = await db.tools.findMany();
  return tools;
};

export const getUserTools = async (userId: number) => {
  const tools = await db.user_tools.findMany({
    where: {
      user_id: userId,
    },
  });
  return tools;
};

export const updateUserTool = async (
  userId: number,
  toolId: number,
  enabled: number,
  docked: number
) => {
  const userTool = await db.user_tools.update({
    where: {
      user_id: userId,
      id: toolId,
    },
    data: {
      enabled: enabled,
      docked: docked,
    },
  });
  return userTool;
};
export const createUserTool = async (userId: number, toolId: number) => {
  const userTool = await db.user_tools.create({
    data: {
      user_id: userId,
      tool_id: toolId,
      enabled: 1,
      docked: 1,
    },
  });
  return userTool;
};

export const deleteUserTool = async (userId: number, toolId: number) => {
  const userTool = await db.user_tools.delete({
    where: {
      user_id: userId,
      id: toolId,
    },
  });
  return userTool;
};
