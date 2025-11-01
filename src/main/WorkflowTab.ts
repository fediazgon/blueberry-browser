import { is } from "@electron-toolkit/utils";
import { NativeImage, WebContentsView } from "electron";
import { join } from "path";

export class WorkflowTab {
  private webContentsView: WebContentsView;
  private _id: string;
  private _title: string;
  private _url: string;
  private _isVisible: boolean = false;
  private _isWorkflow: boolean = true;

  constructor(id: string) {
    this._id = id;
    this._url = "blueberry://workflow";
    this._title = "Workflow Builder";

    // Create the WebContentsView with preload script
    this.webContentsView = new WebContentsView({
      webPreferences: {
        preload: join(__dirname, "../preload/workflow.js"),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // Need to disable sandbox for preload to work
      },
    });

    // Set up event listeners
    this.setupEventListeners();

    // Load the workflow builder renderer
    this.loadWorkflowBuilder();
  }

  private setupEventListeners(): void {
    // Update title when page title changes
    this.webContentsView.webContents.on("page-title-updated", (_, title) => {
      this._title = title;
    });
  }

  private loadWorkflowBuilder(): void {
    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      const workflowUrl = new URL(
        "/workflow/",
        process.env["ELECTRON_RENDERER_URL"],
      );
      this.webContentsView.webContents.loadURL(workflowUrl.toString());
    } else {
      this.webContentsView.webContents.loadFile(
        join(__dirname, "../renderer/workflow.html"),
      );
    }
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get url(): string {
    return this._url;
  }

  get isVisible(): boolean {
    return this._isVisible;
  }

  get isWorkflow(): boolean {
    return this._isWorkflow;
  }

  get webContents() {
    return this.webContentsView.webContents;
  }

  get view(): WebContentsView {
    return this.webContentsView;
  }

  // Public methods
  show(): void {
    this._isVisible = true;
    this.webContentsView.setVisible(true);
  }

  hide(): void {
    this._isVisible = false;
    this.webContentsView.setVisible(false);
  }

  async screenshot(): Promise<NativeImage> {
    return await this.webContentsView.webContents.capturePage();
  }

  async runJs(code: string): Promise<any> {
    return await this.webContentsView.webContents.executeJavaScript(code);
  }

  async getTabHtml(): Promise<string> {
    return await this.runJs("return document.documentElement.outerHTML");
  }

  async getTabText(): Promise<string> {
    return await this.runJs("return document.documentElement.innerText");
  }

  loadURL(_url: string): Promise<void> {
    // Workflow tabs don't navigate to URLs
    return Promise.resolve();
  }

  goBack(): void {
    // No-op for workflow tabs
  }

  goForward(): void {
    // No-op for workflow tabs
  }

  reload(): void {
    this.loadWorkflowBuilder();
  }

  stop(): void {
    this.webContentsView.webContents.stop();
  }

  destroy(): void {
    this.webContentsView.webContents.close();
  }
}
