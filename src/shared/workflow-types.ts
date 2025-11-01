// Shared workflow types used across main and renderer processes

export type NodeType = "prompt" | "ifelse" | "notify" | "start";

export interface Position {
  x: number;
  y: number;
}

// Block-specific data interfaces
export interface PromptNodeData {
  prompt: string;
  useTabContext: boolean;
}

export interface IfElseNodeData {
  condition: string;
}

export interface NotifyNodeData {
  message: string;
  requiresAcknowledgment: boolean;
}

export interface StartNodeData {
  // No additional data needed for start node
}

// Union type for all node data
export type NodeData =
  | PromptNodeData
  | IfElseNodeData
  | NotifyNodeData
  | StartNodeData;

// Workflow node definition
export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: Position;
  data: NodeData;
}

// Edge connecting nodes
export interface WorkflowEdge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  sourceHandle?: string; // For if/else: 'true' or 'false'
  targetHandle?: string;
}

// Complete workflow definition
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

// Workflow execution context
export interface WorkflowContext {
  variables: Record<string, any>;
  currentTabId?: string;
  executionId: string;
}

// Workflow execution status
export type WorkflowStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "failed";

export interface WorkflowExecution {
  workflowId: string;
  executionId: string;
  status: WorkflowStatus;
  currentNodeId?: string;
  context: WorkflowContext;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

// IPC event payloads
export interface WorkflowCreateRequest {
  name: string;
  description?: string;
}

export interface WorkflowSaveRequest {
  workflow: Workflow;
}

export interface WorkflowExecuteRequest {
  workflowId: string;
  tabId?: string;
}

export interface WorkflowExecuteResponse {
  executionId: string;
}

export interface WorkflowHumanResponse {
  executionId: string;
  acknowledged: boolean;
  response?: string;
}

// Execution events sent to renderer
export interface WorkflowExecutionUpdate {
  executionId: string;
  status: WorkflowStatus;
  currentNodeId?: string;
  error?: string;
}

export interface WorkflowNodeExecutionStart {
  executionId: string;
  nodeId: string;
  nodeType: NodeType;
}

export interface WorkflowNodeExecutionComplete {
  executionId: string;
  nodeId: string;
  result?: any;
  error?: string;
}

// Human notification event
export interface WorkflowHumanNotification {
  executionId: string;
  nodeId: string;
  message: string;
  requiresAcknowledgment: boolean;
}
