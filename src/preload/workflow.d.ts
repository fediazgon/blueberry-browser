import { ElectronAPI } from "@electron-toolkit/preload";
import type {
  Workflow,
  WorkflowCreateRequest,
  WorkflowSaveRequest,
  WorkflowExecuteRequest,
  WorkflowExecuteResponse,
  WorkflowHumanResponse,
  WorkflowExecutionUpdate,
  WorkflowNodeExecutionStart,
  WorkflowNodeExecutionComplete,
  WorkflowHumanNotification,
} from "../shared/workflow-types";

interface WorkflowAPI {
  // Workflow CRUD
  createWorkflow: (request: WorkflowCreateRequest) => Promise<Workflow>;
  saveWorkflow: (request: WorkflowSaveRequest) => Promise<boolean>;
  loadWorkflow: (workflowId: string) => Promise<Workflow | null>;
  listWorkflows: () => Promise<Workflow[]>;
  deleteWorkflow: (workflowId: string) => Promise<boolean>;

  // Workflow execution
  executeWorkflow: (
    request: WorkflowExecuteRequest,
  ) => Promise<WorkflowExecuteResponse>;
  stopWorkflow: (executionId: string) => Promise<boolean>;
  resumeWorkflow: (response: WorkflowHumanResponse) => Promise<boolean>;
  getExecutionStatus: (executionId: string) => Promise<any>;

  // Event listeners
  onExecutionUpdate: (
    callback: (update: WorkflowExecutionUpdate) => void,
  ) => void;
  onNodeExecutionStart: (
    callback: (data: WorkflowNodeExecutionStart) => void,
  ) => void;
  onNodeExecutionComplete: (
    callback: (data: WorkflowNodeExecutionComplete) => void,
  ) => void;
  onHumanNotification: (
    callback: (notification: WorkflowHumanNotification) => void,
  ) => void;

  // Remove listeners
  removeExecutionUpdateListener: () => void;
  removeNodeExecutionStartListener: () => void;
  removeNodeExecutionCompleteListener: () => void;
  removeHumanNotificationListener: () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    workflowAPI: WorkflowAPI;
  }
}
