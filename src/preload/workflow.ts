import { contextBridge } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
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

// Workflow specific APIs
const workflowAPI = {
  // Workflow CRUD
  createWorkflow: (request: WorkflowCreateRequest): Promise<Workflow> =>
    electronAPI.ipcRenderer.invoke("workflow-create", request),

  saveWorkflow: (request: WorkflowSaveRequest): Promise<boolean> =>
    electronAPI.ipcRenderer.invoke("workflow-save", request),

  loadWorkflow: (workflowId: string): Promise<Workflow | null> =>
    electronAPI.ipcRenderer.invoke("workflow-load", workflowId),

  listWorkflows: (): Promise<Workflow[]> =>
    electronAPI.ipcRenderer.invoke("workflow-list"),

  deleteWorkflow: (workflowId: string): Promise<boolean> =>
    electronAPI.ipcRenderer.invoke("workflow-delete", workflowId),

  // Workflow execution
  executeWorkflow: (
    request: WorkflowExecuteRequest,
  ): Promise<WorkflowExecuteResponse> =>
    electronAPI.ipcRenderer.invoke("workflow-execute", request),

  stopWorkflow: (executionId: string): Promise<boolean> =>
    electronAPI.ipcRenderer.invoke("workflow-stop", executionId),

  resumeWorkflow: (response: WorkflowHumanResponse): Promise<boolean> =>
    electronAPI.ipcRenderer.invoke("workflow-resume", response),

  getExecutionStatus: (executionId: string) =>
    electronAPI.ipcRenderer.invoke("workflow-status", executionId),

  // Event listeners
  onExecutionUpdate: (callback: (update: WorkflowExecutionUpdate) => void) => {
    electronAPI.ipcRenderer.on("workflow-execution-update", (_, update) =>
      callback(update),
    );
  },

  onNodeExecutionStart: (
    callback: (data: WorkflowNodeExecutionStart) => void,
  ) => {
    electronAPI.ipcRenderer.on("workflow-node-start", (_, data) =>
      callback(data),
    );
  },

  onNodeExecutionComplete: (
    callback: (data: WorkflowNodeExecutionComplete) => void,
  ) => {
    electronAPI.ipcRenderer.on("workflow-node-complete", (_, data) =>
      callback(data),
    );
  },

  onHumanNotification: (
    callback: (notification: WorkflowHumanNotification) => void,
  ) => {
    electronAPI.ipcRenderer.on("workflow-human-notification", (_, data) =>
      callback(data),
    );
  },

  // Remove listeners
  removeExecutionUpdateListener: () => {
    electronAPI.ipcRenderer.removeAllListeners("workflow-execution-update");
  },

  removeNodeExecutionStartListener: () => {
    electronAPI.ipcRenderer.removeAllListeners("workflow-node-start");
  },

  removeNodeExecutionCompleteListener: () => {
    electronAPI.ipcRenderer.removeAllListeners("workflow-node-complete");
  },

  removeHumanNotificationListener: () => {
    electronAPI.ipcRenderer.removeAllListeners("workflow-human-notification");
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("workflowAPI", workflowAPI);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.workflowAPI = workflowAPI;
}
