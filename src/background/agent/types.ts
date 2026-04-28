export interface ToolCallPayload {
  name: string;
  arguments?: Record<string, any> | string;
  id: string;
}
