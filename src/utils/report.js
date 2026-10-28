const pad = value => String(value).padStart(2, '0');
export const localDate = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function dateRange(dateString, type) {
  const [year, month, day] = dateString.split('-').map(Number);
  const selected = new Date(year, month - 1, day);
  const start = new Date(selected);
  const end = new Date(selected);
  if (type === 'weekly') {
    const offset = (selected.getDay() + 6) % 7;
    start.setDate(selected.getDate() - offset);
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 6);
  } else if (type === 'monthly') {
    start.setDate(1);
    end.setMonth(end.getMonth() + 1, 0);
  }
  return { start: localDate(start), end: localDate(end) };
}

const labels = { feat: '功能开发', fix: '问题修复', perf: '性能优化', refactor: '代码重构', docs: '文档完善', test: '测试', build: '构建与部署', ci: '构建与部署', chore: '其他工作', style: '样式调整', revert: '回退' };

export function organizeLogs(logs) {
  const groups = new Map();
  const seen = new Set();
  let ignored = 0;
  for (const [index, log] of logs.entries()) {
    const message = (log.message || '').trim();
    if (!message || /^merge\b/i.test(message)) { ignored++; continue; }
    const conventional = message.match(/^([a-z]+)(?:\(([^)]+)\))?!?:\s*(.+)$/i);
    const category = conventional ? (labels[conventional[1].toLowerCase()] || '其他工作') : '其他工作';
    const knownType = conventional && labels[conventional[1].toLowerCase()];
    const text = knownType ? `${conventional[2] ? `${conventional[2]}：` : ''}${conventional[3].trim()}` : message;
    const key = `${log.repoPath || log.repo}\0${category}\0${text.toLocaleLowerCase()}`;
    if (seen.has(key)) { ignored++; continue; }
    seen.add(key);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push({ text, repo: log.repo, repoPath: log.repoPath, hash: log.hash, date: log.date, order: index });
  }
  return { groups: [...groups].map(([title, items]) => ({ title, items })), ignored };
}

export function reportText(groups, { showDate = false } = {}) {
  const projects = new Map();
  for (const group of groups) {
    for (const item of group.items) {
      const key = item.repoPath || item.repo;
      if (!projects.has(key)) projects.set(key, { name: item.repo, items: [] });
      projects.get(key).items.push({ ...item, category: group.title });
    }
  }
  return [...projects.values()].map(project => {
    project.items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const entries = project.items.map(item => {
      const date = item.date ? new Date(item.date) : null;
      const when = showDate && date && !Number.isNaN(date.getTime()) ? `${localDate(date).slice(5)}  ` : '';
      const category = item.category === '其他工作' ? '' : `${item.category}：`;
      // Long commit subjects often use " - " as a list delimiter; retain each part as a readable sub-item.
      const parts = item.text.split(/\s+-\s+/);
      if (parts.length >= 3) {
        return `- ${when}${category}${parts[0]}\n${parts.slice(1).map(part => `  - ${part}`).join('\n')}`;
      }
      return `- ${when}${category}${item.text}`;
    });
    return `## ${project.name}\n${entries.join('\n')}`;
  }).join('\n\n');
}
