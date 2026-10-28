export {};

declare global {
  interface Window {
    api: {
      platform: string;
      getGitLogs(params: { author?: string; since: string; until: string; repoPaths: { name: string; path: string }[] }): Promise<{
        logs: { hash: string; date: string; message: string; repo: string; repoPath: string }[];
        errors: { repo: string; message: string }[];
        users: { repo: string; name: string; email: string }[];
      }>;
      getGitUser(repoPath: string): Promise<{ name: string; email: string }>;
      getRepoInfo(repoPath: string): Promise<{ name: string; path: string }>;
      scanRepositories(rootPath: string): Promise<{ repos: { name: string; path: string }[]; skipped: number; truncated: boolean }>;
      chooseRepo(): Promise<string[]>;
      chooseScanFolder(): Promise<string | null>;
      saveReport(params: { content: string; filename: string }): Promise<boolean>;
      minimizeWindow(): Promise<void>;
      toggleMaximizeWindow(): Promise<boolean>;
      isWindowMaximized(): Promise<boolean>;
      closeWindow(): Promise<void>;
      onWindowMaximized(callback: (maximized: boolean) => void): () => void;
    };
    electronStore: {
      get(key: string): Promise<unknown>;
      set(key: string, value: unknown): Promise<boolean>;
      delete(key: string): Promise<boolean>;
    };
  }
}
