import React, { useState, useEffect } from "react";
import { useDarkMode } from "../../common/hooks/useDarkMode";

export const WorkflowApp: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className={`w-full h-full ${isDarkMode ? "dark" : ""}`}>
      <div className="flex flex-col w-full h-full bg-background text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h1 className="text-lg font-semibold">Workflow Builder</h1>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md">
              Save
            </button>
            <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
              Run
            </button>
          </div>
        </div>

        {/* Canvas Area - will be replaced with ReactFlow */}
        <div className="flex-1 bg-muted/20">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Workflow canvas will go here
          </div>
        </div>
      </div>
    </div>
  );
};
