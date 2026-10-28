<template>
  <main class="app">
    <header class="header">
      <div class="titlebar-leading">
        <div v-if="windowControlsAvailable" class="window-controls" aria-label="窗口控制">
          <button class="window-button close-window" aria-label="关闭窗口" title="关闭" @click="closeWindow"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.1 3.1l5.8 5.8m0-5.8L3.1 8.9" /></svg></button>
          <button class="window-button minimize-window" aria-label="最小化窗口" title="最小化" @click="minimizeWindow"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.7 6h6.6" /></svg></button>
          <button class="window-button maximize-window" :aria-label="isMaximized ? '还原窗口' : '最大化窗口'" :title="isMaximized ? '还原' : '最大化'" @click="toggleMaximizeWindow"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 5V3h2M9 7v2H7M3 3l2.2 2.2M9 9L6.8 6.8" /></svg></button>
        </div>
        <div class="brand"><img class="brand-icon" :src="appIcon" alt=""><span>DoWhat</span></div>
      </div>
      <span class="local-note">你的工作记录，留在本地</span>
    </header>

    <div class="workspace">
      <div class="intro"><div><h1>工作记录</h1><p class="intro-description">把零散的提交，整理成清晰的进展。</p></div><span class="intro-date">{{ todayLabel }}</span></div>

      <div class="content">
        <section class="setup" aria-label="报告设置">
          <h2 class="setup-title">生成设置</h2>
          <div class="setting-group"><span class="field-title">仓库 <span class="field-number">{{ repos.length ? String(repos.length).padStart(2, '0') : '' }}</span></span><div class="repos"><span v-for="(repo, index) in repos" :key="repo.path" class="repo-chip" :title="repo.path">{{ repo.name }}<button :aria-label="`移除 ${repo.name}`" @click="removeRepo(index)">×</button></span><button class="add-repo" @click="openRepoPicker"><span>＋</span> {{ repos.length ? '管理仓库' : '选择 Git 仓库' }}</button></div></div>
          <div class="setting-group"><span class="field-title">报告周期</span><div class="periods"><button v-for="option in types" :key="option.value" :class="{ selected: reportType === option.value }" :aria-pressed="reportType === option.value" @click="reportType = option.value">{{ option.label }}</button></div><div class="date-option"><DatePicker v-model="reportDate" /></div><div v-if="reportType !== 'daily'" class="range-hint">{{ rangeLabel }}</div></div>
          <div class="setting-group author-group"><label class="field-title" for="author">提交作者</label><div class="author-input"><input id="author" v-model="author" placeholder="自动读取 Git 用户"><button v-if="author" class="reset-author" title="恢复自动读取" aria-label="恢复自动读取" @click="author = ''">×</button></div><button v-if="repos.length && !author" class="detect" @click="detectUser">查看 Git 用户 ↗</button><span v-else class="author-hint">{{ author ? '按填写的作者筛选' : '也可以手动输入名称或邮箱' }}</span></div>
          <button class="generate" :disabled="loading || !reportDate" @click="generate">{{ loading ? '正在获取…' : '获取提交记录' }} <span>↗</span></button>
        </section>

        <section class="result" aria-label="工作报告">
          <div class="result-head"><div><h2>报告内容 <span v-if="generated">{{ stats.count }} 条</span></h2><p class="result-eyebrow">{{ generated ? generatedRange : rangeLabel }} <span>·</span> {{ generated ? '可直接编辑' : '准备生成' }}</p></div><div v-if="generated" class="actions"><button @click="saveReport">下载</button><button class="copy" @click="copyReport">{{ copied ? '已复制' : '复制内容' }} ↗</button></div></div>
          <div v-if="identity" class="identity">{{ identity }}</div>
          <div v-if="stale && generated" class="notice">设置已更改，请重新获取提交记录。</div>
          <div v-if="errors.length" class="notice error"><strong>部分仓库未能读取</strong><span v-for="(error, index) in errors" :key="index">{{ error.repo }}：{{ error.message }}</span></div>
          <textarea v-if="generated" v-model="draft" class="editor" aria-label="编辑报告内容" spellcheck="false"></textarea>
          <div v-else class="empty"><div class="empty-mark">✳</div><h3>{{ repos.length ? '一切准备就绪' : '先选择一个仓库' }}</h3><p>{{ repos.length ? '点击获取提交记录，' : '我们会自动识别 Git 用户，' }}<br>把提交整理成一份可编辑的报告。</p></div>
          <div class="result-footer"><span>{{ generated ? `已整理 ${stats.raw} 条提交，过滤 ${stats.ignored} 条合并或重复记录` : '全部在本地完成，无需上传' }}</span><span v-if="generated">可直接编辑 · Markdown</span></div>
        </section>
      </div>
    </div>
    <div v-if="pickerOpen" class="picker-overlay" @click.self="closeRepoPicker" @keydown.esc="closeRepoPicker">
      <section class="picker" role="dialog" aria-modal="true" aria-labelledby="picker-title">
        <div class="picker-header"><div><h2 id="picker-title">添加 Git 仓库</h2><p>直接选择仓库，或扫描存放项目的文件夹。</p></div><button class="picker-close" aria-label="关闭" @click="closeRepoPicker">×</button></div>
        <div class="picker-actions"><button class="picker-primary" :disabled="pickerBusy" @click="selectRepoDirectories">选择仓库</button><button class="picker-secondary" :disabled="pickerBusy" @click="scanFolder">扫描项目文件夹</button></div>
        <div class="path-entry"><label class="sr-only" for="repo-path">仓库路径</label><input id="repo-path" v-model="manualPath" placeholder="或粘贴仓库路径" @keydown.enter.prevent="addManualPath"><button :disabled="pickerBusy || !manualPath.trim()" @click="addManualPath">添加</button></div>
        <p class="picker-hint">支持多选；扫描当前文件夹及下方三层目录，跳过依赖和隐藏目录。</p>
        <div v-if="pickerBusy" class="picker-state">正在查找仓库…</div>
        <template v-else-if="candidates.length"><div class="picker-list-heading"><span>找到的仓库 <span class="picker-count">{{ candidates.length }}</span></span><button @click="toggleAll">{{ allSelected ? '取消全选' : '全选' }}</button></div><div class="candidate-list"><label v-for="item in candidates" :key="item.path" class="candidate"><input v-model="item.selected" type="checkbox" :disabled="item.added"><span class="candidate-text"><strong>{{ item.name }}</strong><small :title="item.path">{{ item.path }}</small></span><span v-if="item.added" class="already-added">已添加</span></label></div></template>
        <div v-else class="picker-state">选择或扫描后，仓库会显示在这里。</div>
        <div v-if="pickerMessage" class="picker-message" role="status">{{ pickerMessage }}</div>
        <div class="picker-footer"><span>已选择 {{ selectedCount }} 个</span><div><button class="picker-cancel" @click="closeRepoPicker">取消</button><button class="picker-primary" :disabled="pickerBusy || !selectedCount" @click="confirmRepos">添加所选</button></div></div>
      </section>
    </div>
    <div v-if="toast" class="toast" role="status">{{ toast }}</div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import DatePicker from '@/components/DatePicker.vue'
import { dateRange, localDate, organizeLogs, reportText } from '@/utils/report.js'

const appIcon = `${import.meta.env.BASE_URL}app-icon.png`
const types = [{ value: 'daily', label: '日报' }, { value: 'weekly', label: '周报' }, { value: 'monthly', label: '月报' }]
const windowControlsAvailable = Boolean(window.api?.minimizeWindow)
const isMaximized = ref(false)
let unsubscribeWindowState
async function minimizeWindow() { await window.api.minimizeWindow() }
async function toggleMaximizeWindow() { isMaximized.value = await window.api.toggleMaximizeWindow() }
async function closeWindow() { await window.api.closeWindow() }
const reportType = ref('daily')
const reportDate = ref(localDate(new Date()))
const todayLabel = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())
const repos = ref([])
// An empty author means each repository's own Git identity is used.
const author = ref('')
const loading = ref(false)
const generated = ref(false)
const draft = ref('')
const generatedRange = ref('')
const generatedTitle = ref('')
const generatedSettings = ref('')
const identity = ref('')
const errors = ref([])
const stats = ref({ count: 0, raw: 0, ignored: 0 })
const copied = ref(false)
const toast = ref('')
const pickerOpen = ref(false)
const pickerBusy = ref(false)
const candidates = ref([])
const pickerMessage = ref('')
const manualPath = ref('')
let pickerVersion = 0
const selectedCount = computed(() => candidates.value.filter(item => item.selected && !item.added).length)
const allSelected = computed(() => candidates.value.some(item => !item.added) && candidates.value.filter(item => !item.added).every(item => item.selected))
let toastTimer
const range = computed(() => reportDate.value ? dateRange(reportDate.value, reportType.value) : null)
const rangeLabel = computed(() => !range.value ? '请选择日期' : range.value.start === range.value.end ? range.value.start : `${range.value.start} — ${range.value.end}`)
const settingsKey = () => JSON.stringify([reportDate.value, reportType.value, repos.value, author.value])
const stale = computed(() => generatedSettings.value !== settingsKey())
function notify(message) { toast.value = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.value = '', 3500) }
watch([repos, author], () => { identity.value = '' }, { deep: true })

onMounted(async () => {
  if (windowControlsAvailable) {
    unsubscribeWindowState = window.api.onWindowMaximized(value => { isMaximized.value = value })
    isMaximized.value = await window.api.isWindowMaximized()
  }
  if (!window.electronStore) return
  try {
    const stored = await window.electronStore.get('repos')
    repos.value = Array.isArray(stored) ? stored.filter(repo => repo && repo.name && repo.path) : []
  } catch { notify('读取仓库设置失败') }
})
onUnmounted(() => unsubscribeWindowState?.())
async function persistRepos(next) {
  await window.electronStore.set('repos', JSON.parse(JSON.stringify(next)))
  repos.value = next
}
function pathKey(path) {
  const normalized = path.replace(/\\/g, '/').replace(/\/$/, '')
  return window.api?.platform === 'win32' ? normalized.toLowerCase() : normalized
}
function openRepoPicker() {
  if (!window.api?.scanRepositories || !window.electronStore) return notify('请重启桌面应用后再选择仓库')
  pickerVersion++; candidates.value = []; manualPath.value = ''; pickerMessage.value = ''; pickerBusy.value = false; pickerOpen.value = true
}
function closeRepoPicker() { pickerVersion++; pickerOpen.value = false; pickerBusy.value = false }
function addCandidates(found) {
  const existing = new Set(repos.value.map(repo => pathKey(repo.path)))
  const current = new Set(candidates.value.map(repo => pathKey(repo.path)))
  for (const repo of found) {
    const key = pathKey(repo.path)
    if (current.has(key)) continue
    const added = existing.has(key)
    candidates.value.push({ ...repo, added, selected: !added })
    current.add(key)
  }
}
async function selectRepoDirectories() {
  const version = pickerVersion
  try {
    const paths = await window.api.chooseRepo()
    if (!pickerOpen.value || version !== pickerVersion || !paths.length) return
    await validatePaths(paths, version)
  } catch (error) { if (version === pickerVersion) pickerMessage.value = `无法选择目录：${error.message}` }
}
async function validatePaths(paths, version) {
  pickerBusy.value = true; pickerMessage.value = ''
  try {
    const results = await Promise.allSettled(paths.map(path => window.api.getRepoInfo(path)))
    if (version !== pickerVersion) return
    const found = results.filter(result => result.status === 'fulfilled').map(result => result.value)
    const invalid = paths.filter((_, index) => results[index].status === 'rejected')
    addCandidates(found)
    if (invalid.length) pickerMessage.value = `以下路径不是可读取的 Git 仓库：${invalid.join('、')}`
    else if (found.length) pickerMessage.value = '已找到仓库，请勾选后添加。'
  } finally { if (version === pickerVersion) pickerBusy.value = false }
}
async function addManualPath() {
  const input = manualPath.value.trim().replace(/^"(.*)"$/, '$1')
  if (!input) return
  const version = pickerVersion
  await validatePaths([input], version)
  if (version === pickerVersion && !pickerMessage.value.startsWith('以下路径')) manualPath.value = ''
}
async function scanFolder() {
  const version = pickerVersion
  try {
    const folder = await window.api.chooseScanFolder()
    if (!pickerOpen.value || version !== pickerVersion || !folder) return
    pickerBusy.value = true; pickerMessage.value = ''
    const result = await window.api.scanRepositories(folder)
    if (version !== pickerVersion) return
    addCandidates(result.repos)
    const details = [result.repos.length ? `找到 ${result.repos.length} 个仓库。` : '没有找到仓库，请尝试选择其他文件夹或直接输入仓库路径。']
    if (result.truncated) details.push('目录过多，扫描已提前结束；可选择更具体的文件夹。')
    if (result.skipped) details.push(`${result.skipped} 个目录无法读取或验证。`)
    pickerMessage.value = details.join(' ')
  } catch (error) { if (version === pickerVersion) pickerMessage.value = `扫描失败：${error.message || '请检查文件夹权限'}` }
  finally { if (version === pickerVersion) pickerBusy.value = false }
}
function toggleAll() { const select = !allSelected.value; for (const item of candidates.value) if (!item.added) item.selected = select }
async function confirmRepos() {
  const selected = candidates.value.filter(item => item.selected && !item.added).map(({ name, path }) => ({ name, path }))
  if (!selected.length) return
  const version = pickerVersion
  pickerBusy.value = true
  try { await persistRepos([...repos.value, ...selected]); if (version === pickerVersion) { closeRepoPicker(); notify(`已添加 ${selected.length} 个仓库`) } }
  catch { if (version === pickerVersion) pickerMessage.value = '保存失败，请重试。' }
  finally { if (version === pickerVersion) pickerBusy.value = false }
}
async function removeRepo(index) {
  try { await persistRepos(repos.value.filter((_, i) => i !== index)) } catch { notify('保存仓库设置失败') }
}
async function detectUser() {
  if (!repos.value.length) return notify('请先选择仓库')
  try {
    const results = await Promise.all(repos.value.map(async repo => ({ repo: repo.name, ...await window.api.getGitUser(repo.path) })))
    identity.value = results.map(user => `${user.repo}：${[user.name, user.email].filter(Boolean).join(' · ') || '未配置 Git 用户'}`).join('　 /　 ')
  } catch (error) { notify(`读取 Git 用户失败：${error.message || '请检查仓库'}`) }
}
async function generate() {
  if (!repos.value.length) { notify('请先选择 Git 仓库'); return }
  if (!window.api) return notify('请在桌面应用中获取提交记录')
  loading.value = true
  const currentRange = { ...range.value }
  const currentType = types.find(type => type.value === reportType.value).label
  const currentKey = settingsKey()
  try {
    const result = await window.api.getGitLogs({ author: author.value, since: `${currentRange.start} 00:00:00`, until: `${currentRange.end} 23:59:59`, repoPaths: JSON.parse(JSON.stringify(repos.value)) })
    const organized = organizeLogs(result.logs)
    const title = `工作${currentType} · ${currentRange.start === currentRange.end ? currentRange.start : `${currentRange.start} 至 ${currentRange.end}`}`
    draft.value = `# ${title}\n\n${organized.groups.length ? reportText(organized.groups, { showDate: currentType !== '日报' }) : '暂无符合条件的提交记录。'}`
    generatedRange.value = currentRange.start === currentRange.end ? currentRange.start : `${currentRange.start} — ${currentRange.end}`
    generatedTitle.value = title; generatedSettings.value = currentKey; errors.value = result.errors
    identity.value = result.users.map(user => `${user.repo}：${[user.name, user.email].filter(Boolean).join(' · ') || '未配置 Git 用户'}`).join('　 /　 ')
    stats.value = { count: organized.groups.reduce((n, group) => n + group.items.length, 0), raw: result.logs.length, ignored: organized.ignored }
    generated.value = true
  } catch (error) { notify(`获取失败：${error.message || '请检查仓库设置'}`) }
  finally { loading.value = false }
}
async function copyReport() {
  try { await navigator.clipboard.writeText(draft.value); copied.value = true; setTimeout(() => copied.value = false, 2000) } catch { notify('复制失败，请手动选择并复制') }
}
async function saveReport() {
  try { if (await window.api.saveReport({ content: draft.value, filename: `${generatedTitle.value}.md` })) notify('报告已保存') } catch { notify('保存失败，请重试') }
}
</script>

<style scoped>
@import './workspace.css';
</style>
