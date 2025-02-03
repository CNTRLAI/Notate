export interface Tool {
  id: number;
  name: string;
  description: string;
}

export interface UserTool {
  id: number;
  name: string;
  enabled: number;
  docked: number;
}
