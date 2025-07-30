export { }; // 确保这是一个模块，避免全局污染

declare global {
  interface Window {
    api: {
      getGitLogs: (params: { author?: string; since?: string; until?: string; repoPaths?: String }) => Promise<any[]>;
      // 如果你后续有更多api，可以继续在这里声明
    }
    electronStore: {
      get: (key: string) => Promise<any>
      set: (key: string, value: any) => Promise<void>
      delete: (key: string) => Promise<void>
    }
  }
}
