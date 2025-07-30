export {}; // 确保这是一个模块，避免全局污染

declare global {
  interface Window {
    api: {
      getGitLogs: (params: { author?: string; since?: string; until?: string }) => Promise<any[]>;
      // 如果你后续有更多api，可以继续在这里声明
    };
  }
}
