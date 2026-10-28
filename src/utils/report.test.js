import test from 'node:test';
import assert from 'node:assert/strict';
import { dateRange, organizeLogs, reportText } from './report.js';

test('报告周期按本地日期计算，周从周一开始，跨月和跨年正确', () => {
  assert.deepEqual(dateRange('2026-01-01', 'weekly'), { start: '2025-12-29', end: '2026-01-04' });
  assert.deepEqual(dateRange('2024-02-18', 'monthly'), { start: '2024-02-01', end: '2024-02-29' });
  assert.deepEqual(dateRange('2026-10-27', 'daily'), { start: '2026-10-27', end: '2026-10-27' });
});

test('报告按仓库分组，长提交拆成易读的子项，保留未知前缀', () => {
  const { groups } = organizeLogs([
    { repo: '客户端', repoPath: '/app', message: 'feat: 优化订单 - 调整列表 - 增加搜索', date: '2025-06-01T12:00:00' },
    { repo: '客户端', repoPath: '/app', message: 'wip: 支持 SDK - v2', date: '2025-06-01T11:00:00' },
  ]);
  assert.equal(reportText(groups), '## 客户端\n- 功能开发：优化订单\n  - 调整列表\n  - 增加搜索\n- wip: 支持 SDK - v2');
  assert.equal(reportText(groups, { showDate: true }), '## 客户端\n- 06-01  功能开发：优化订单\n  - 调整列表\n  - 增加搜索\n- 06-01  wip: 支持 SDK - v2');
});

test('分类、保留英文和模块名，并只在同仓库去重', () => {
  const logs = [
    { repo: 'A', repoPath: '/a', message: 'feat(auth): 支持 OAuth 登录', hash: '1', date: '2025-06-01T12:00:00' },
    { repo: 'A', repoPath: '/a', message: 'feat(auth): 支持 OAuth 登录', hash: '2' },
    { repo: 'B', repoPath: '/b', message: 'feat(auth): 支持 OAuth 登录', hash: '3' },
    { repo: 'A', repoPath: '/a', message: 'fix: API timeout', hash: '4' },
    { repo: 'A', repoPath: '/a', message: 'Merge branch main', hash: '5' },
    { repo: 'A', repoPath: '/a', message: '更新 README', hash: '6' },
  ];
  const result = organizeLogs(logs);
  assert.equal(result.ignored, 2);
  assert.deepEqual(result.groups.map(group => group.title), ['功能开发', '问题修复', '其他工作']);
  assert.equal(result.groups[0].items.length, 2);
  assert.match(reportText(result.groups), /## A\n- 功能开发：auth：支持 OAuth 登录/);
  assert.match(reportText(result.groups), /## B\n- 功能开发：auth：支持 OAuth 登录/);
  assert.match(reportText(result.groups, { showDate: true }), /- 06-01  功能开发：auth：支持 OAuth 登录/);
  assert.ok(reportText(result.groups).indexOf('API timeout') < reportText(result.groups).indexOf('更新 README'));
  assert.match(reportText(result.groups), /API timeout/);
  assert.match(reportText(result.groups), /更新 README/);
});
