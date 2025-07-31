<template>
  <div class="daily-report-container">
    <!-- 头部区域 -->
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <i class="fas fa-chart-line"></i>
          <h1>日报生成器</h1>
        </div>
        <p class="subtitle">智能生成您的工作日报，提升效率🦥</p>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 控制面板 -->
      <div class="control-panel">
        <div class="panel-header" style="display: flex; justify-content:space-between; align-items: center;">
          <h2><i class="fas fa-cog"></i> 生成设置</h2>
          <button class="generate-btn-round" @click="showRepoDialog = true">
            <span>
              <i class="fas fa-plus" style="color: white;"></i>
            </span>
          </button>
        </div>

        <div class="form-group">
          <label for="report-date">
            <i class="fas fa-calendar-alt"></i>
            选择日期
          </label>
          <input type="date" id="report-date" class="date-input" v-model="reportDate" @change="onSettingsChange">
        </div>

        <div class="form-group">
          <label for="report-type">
            <i class="fas fa-file-alt"></i>
            报告类型
          </label>
          <select id="report-type" class="select-input" v-model="reportType" @change="onSettingsChange">
            <option value="daily">日报</option>
            <option value="weekly">周报</option>
            <option value="monthly">月报</option>
          </select>
        </div>


        <button class="generate-btn" :class="{ loading: isLoading }" @click="generateReport" :disabled="isLoading">
          <span class="btn-text">
            <i class="fas fa-magic"></i>
            生成日报
          </span>
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            生成中...
          </div>
        </button>

        <!-- 设置更改提示 -->
        <div v-if="showUpdateHint" class="update-hint">
          <i class="fas fa-info-circle"></i>
          设置已更改，点击"生成日报"更新内容
        </div>
      </div>

      <!-- 日报展示区域 -->
      <div class="report-display">
        <!-- 空状态 -->
        <div v-if="!reportGenerated" class="empty-state">
          <i class="fas fa-file-text"></i>
          <h3>暂无日报</h3>
          <p>点击"生成日报"按钮开始创建您的工作日报</p>
        </div>

        <!-- 日报内容 -->
        <div v-if="reportGenerated" class="report-content">
          <div class="report-header">
            <h2>{{ reportTitle }}</h2>
            <div class="report-meta">
              <span>{{ formattedDate }}</span>
              <span>{{ departmentNames["tech"] }}</span>
            </div>
          </div>

          <div class="report-body">
            <div class="report-section">
              <h3><i class="fas fa-tasks"></i> 今日完成工作</h3>
              <ul v-if="currentReport.completed.length">
                <li v-for="(task, index) in currentReport.completed" :key="index"
                  :style="{ animationDelay: `${index * 0.1}s` }" class="fade-in-item">
                  {{ task }}
                </li>
              </ul>
              <div v-else class="empty-state">
                <p>暂无完成的任务，摸会鱼吧 🐟</p>
              </div>
            </div>
          </div>

          <div class="report-actions">
            <button class="action-btn secondary" @click="handleAction('编辑')">
              <i class="fas fa-edit"></i>
              编辑
            </button>
            <button class="action-btn primary" @click="handleAction('下载')">
              <i class="fas fa-download"></i>
              下载
            </button>
            <button class="action-btn primary" @click="handleAction('复制')">
              <i class="fas fa-share"></i>
              复制
            </button>
          </div>
        </div>
      </div>
    </main>
    <!-- 弹窗遮罩 -->
    <transition name="fade">
      <div v-if="showRepoDialog" class="dialog-mask" @click.self="showRepoDialog = false">
        <div class="dialog-card">
          <header class="dialog-header">
            <h3>添加 Git 仓库</h3>
            <button class="close-btn" @click="showRepoDialog = false">&times;</button>
          </header>
          <div class="dialog-form">
            <label for="repo-name-label" style="font-weight: 600; margin-bottom: 6px; display: block;">用户名
              <input type="text" v-model="author" placeholder="请输入git开发名称" required />
            </label>
          </div>
          <form @submit.prevent="addRepos" class="dialog-form">
            <div v-for="(repo, index) in repoList" :key="index" class="repo-item">
              <label class="repo-name-label">
                <div style="display: flex; justify-content: space-between;">
                  <div>名称</div>
                  <button v-if="repoList.length > 1" type="button" class="btn-secondary small-btn inline-remove-btn"
                    @click="removeRepo(index)" title="删除仓库">
                    删除
                  </button>
                </div>

                <input type="text" v-model="repo.name" placeholder="如：项目名称" required />

              </label>

              <label>
                路径
                <input type="text" v-model="repo.path" placeholder="如：D:\Code\xx-xx .git文件夹层级" required />
              </label>

              <hr v-if="index !== repoList.length - 1" />
            </div>

            <button type="button" class="btn-primary add-btn" @click="addNewRepo">
              <i class="fas fa-plus"></i> 添加仓库
            </button>

            <footer class="dialog-footer">
              <button type="button" @click="showRepoDialog = false" class="btn-secondary">取消</button>
              <button type="submit" class="btn-primary">确认</button>
            </footer>
          </form>
        </div>
      </div>
    </transition>
    <!-- Toast 提示 -->
    <div v-if="toastMessage" class="toast">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import moment from 'moment';
import { ElMessage } from 'element-plus'
import axios from 'axios';
// 生命周期
onMounted(async () => {
  // 设置默认日期为今天
  const today = new Date().toISOString().split('T')[0];
  reportDate.value = today;

  console.log('📅 当前日期设定为:', today);

  try {
    const reposRaw = await window.electronStore.get('repos');
    const authorRaw = await window.electronStore.get('author');
    repoList.value = Array.isArray(reposRaw) ? reposRaw : [{ name: '', path: '' }];
    author.value = typeof authorRaw === 'string' ? authorRaw : '';
    if (repoList.value.length === 0 || !author.value) {
      console.warn('⚠️ 基础信息不完整，请检查是否已保存');
    }
  } catch (e) {
    ElMessage.info('未配置基础数据');
  }
});

// 响应式数据
const reportDate = ref('')
const reportType = ref('daily')
const department = ref('tech')
const isLoading = ref(false)
const reportGenerated = ref(false)
const showUpdateHint = ref(false)
const toastMessage = ref('')
const currentReport = ref({
  completed: [] as string[],
  planned: [] as string[],
  issues: [] as string[],
  suggestions: [] as string[]
})
const showRepoDialog = ref(false)
const repoList = ref<{ name: string; path: string }[]>([
  { name: '', path: '' }
])
const author = ref('')
// 部门名称映射
const departmentNames: Record<string, string> = {
  tech: '抓到一个牛马🐂🐎',
}

// 报告类型名称映射
const reportTypeNames: Record<string, string> = {
  daily: '日报',
  weekly: '周报',
  monthly: '月报'
}


// 计算属性
const reportTitle = computed(() => {
  return `今天干了多少活`
})
const gitLogs = ref([]);
const formattedDate = computed(() => {
  if (!reportDate.value) return ''
  const dateObj = new Date(reportDate.value)
  return dateObj.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 方法
const generateReport = async () => {
  isLoading.value = true;
  showUpdateHint.value = false;
  // 参数校验
  if (!author.value || !repoList.value.length) {
    ElMessage.warning('未配置基础数据，请填写作者信息并添加至少一个仓库');
    isLoading.value = false;
    return;
  }
  const sinceDate = moment(reportDate.value).startOf('day').format('YYYY-MM-DD HH:mm:ss');
  const untilDate = moment(reportDate.value).add(1, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss');
  const plainRepoList = JSON.parse(JSON.stringify(repoList.value));
  try {
    const res = await window.api.getGitLogs({
      author: author.value,
      since: sinceDate,
      until: untilDate,
      repoPaths: plainRepoList
    });

    console.log('Git 日志数据：', res);

    const completedLogs = res
      .filter(log => !log.message.startsWith('Merge'))  // 过滤掉 Merge 提交
      .map(log => {
        // 去掉所有英文字母和左右括号（包括括号里的内容）
        // 先删除所有英文字符和括号
        // 如果只想去掉括号和括号内内容，可以用 /\([^)]*\)/g
        // 这里分两步做：

        // 1. 删除括号及里面内容
        let filteredMessage = log.message.replace(/\([^)]*\)/g, '');
        // 2. 删除剩余的所有英文字母
        filteredMessage = filteredMessage.replace(/[a-zA-Z]/g, '');

        // 去掉多余空格
        filteredMessage = filteredMessage.trim();

        return `[${moment(log.date).format('YYYY-MM-DD')}]-${log.repo}-${filteredMessage}`;
      });
    currentReport.value = {
      completed: completedLogs,
      planned: [],
      issues: [],
      suggestions: []
    };

    reportGenerated.value = true;
  } catch (err) {
    console.error('获取 Git 日志失败:', err);
  } finally {
    isLoading.value = false;
  }
};
const onSettingsChange = () => {
  if (reportGenerated.value) {
    showUpdateHint.value = true
    // 3秒后自动隐藏提示
    setTimeout(() => {
      showUpdateHint.value = false
    }, 3000)
  }
}

const handleAction = (action: string) => {
  if (action === '复制') {
    handleActionCopy()
  } else {
    showToast(`${action}功能开发中...`)
  }
}
const handleActionCopy = async () => {
  try {
    const contentToCopy = generateReportText(); // 生成需要复制的文本
    await navigator.clipboard.writeText(contentToCopy);
    ElMessage.success('复制成功！');
  } catch (err) {
    ElMessage.error('复制失败，请手动复制');
    console.error('复制失败:', err);
  }
};
const generateReportText = () => {
  const report = currentReport.value;
  const sections = [
    { title: '✅ 今日完成', items: report.completed },
  ];

  return sections
    .map(section => {
      if (!section.items || section.items.length === 0) return `${section.title}：无`;
      return `${section.title}：\n` + section.items.map(item => `- ${item}`).join('\n');
    })
    .join('\n\n');
};
const showToast = (message: string) => {
  toastMessage.value = message
  setTimeout(() => {
    toastMessage.value = ''
  }, 2000)
}


// 新增一个空仓库项
const addNewRepo = () => {
  repoList.value.push({ name: '', path: '' })
}

// 删除指定索引仓库项
const removeRepo = (index: number) => {
  repoList.value.splice(index, 1)
}

// 提交所有仓库
const addRepos = async () => {
  // 校验是否所有条目都填写完整
  for (const repo of repoList.value) {
    if (!repo.name.trim() || !repo.path.trim()) {
      ElMessage.warning('请填写所有仓库的名称和路径')
      return
    }
  }
  // 处理路径，把所有 \ 替换成 /
  const normalizedRepos = repoList.value.map(repo => ({
    name: repo.name.trim(),
    path: repo.path.replace(/\\/g, '/').trim()
  }))
  // 保存到本地缓存（Electron Store）
  try {
    await window.electronStore.set('repos', JSON.parse(JSON.stringify(normalizedRepos)))
    await window.electronStore.set('author', JSON.parse(JSON.stringify(author.value)))
    ElMessage.success(`成功添加 ${repoList.value.length} 个仓库`)
  } catch (error) {
    console.error('保存失败', error)
    ElMessage.error('保存仓库信息失败')
    return
  }

  // // 清空并关闭弹窗
  // repoList.value = [{ name: '', path: '' }]
  showRepoDialog.value = false
}
</script>

<style scoped>
.daily-report-container {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: #333;
  line-height: 1.6;
  padding: 20px;
}

/* 头部样式 */
.header {
  text-align: center;
  margin-bottom: 40px;
}

.header-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 15px;
}

.logo i {
  font-size: 2.5rem;
  color: #667eea;
}

.logo h1 {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.1rem;
  color: #666;
  font-weight: 400;
}

/* 主要内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 30px;
  align-items: start;
  max-width: 1300px;
  margin: 0 auto;
}

/* 控制面板样式 */
.control-panel {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 20px;
}

.panel-header {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.panel-header h2 {
  font-size: 1.4rem;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-header i {
  color: #667eea;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #555;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.form-group i {
  color: #667eea;
  width: 16px;
}

.date-input,
.select-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #fff;

  /* 新增统一样式 */
  box-sizing: border-box;
  appearance: none;
  /* 移除原生样式影响 */
}

input[type="date"]::-webkit-inner-spin-button,
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(0.5);
  /* 让图标与背景协调 */
  margin-left: 5px;
}

.date-input:focus,
.select-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 生成按钮样式 */
.generate-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  margin-top: 10px;
}

/* 圆形生成按钮样式 */
.generate-btn-round {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 50%;
  /* 关键：变成圆形 */
  font-size: 24px;
  /* 让图标更明显 */
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.generate-btn:active {
  transform: translateY(0);
}

.generate-btn:disabled {
  pointer-events: none;
}

.btn-text,
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
}

.generate-btn.loading .btn-text {
  opacity: 0;
}

.generate-btn.loading .loading-spinner {
  opacity: 1;
}

/* 更新提示 */
.update-hint {
  background: #fff3cd;
  color: #856404;
  padding: 10px 15px;
  border-radius: 8px;
  margin-top: 15px;
  border: 1px solid #ffeaa7;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideDown 0.3s ease;
}

/* 日报展示区域 */
.report-display {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-height: 500px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 20px;
  color: #ddd;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #666;
}

.empty-state p {
  font-size: 1rem;
  line-height: 1.5;
}

/* 日报内容样式 */
.report-content {
  animation: fadeInUp 0.6s ease;
}

.report-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.report-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 10px;
}

.report-meta {
  display: flex;
  gap: 20px;
  font-size: 0.95rem;
  color: #666;
}

.report-meta span {
  background: #f8f9fa;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #e9ecef;
}

.report-section {
  margin-bottom: 25px;
}

.report-section h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.report-section i {
  color: #667eea;
  width: 20px;
}

.report-section ul {
  list-style: none;
  padding: 0;
}

.report-section li {
  background: #f8f9fa;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  transition: all 0.3s ease;
}

.report-section li:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

/* 操作按钮样式 */
.report-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.action-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.action-btn.secondary {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e9ecef;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.action-btn.primary:hover {
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

/* Toast 样式 */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #333;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  z-index: 1000;
  animation: toastSlideIn 0.3s ease;
}

/* 弹窗遮罩 */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* 弹窗主体 */
.dialog-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 25px 30px;
  width: 400px;
  max-width: 90vw;
  max-height: 80vh;
  /* 限制最大高度，避免超出屏幕 */
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow-y: auto;
  /* 超出时纵向滚动 */
  -webkit-overflow-scrolling: touch;
  /* 移动端滚动顺滑 */
}

/* 隐藏滚动条 - Webkit 浏览器 */
.dialog-card::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* 隐藏滚动条 - Firefox */
.dialog-card {
  scrollbar-width: none;
  /* Firefox */
}

/* 隐藏滚动条 - IE 和 Edge */
.dialog-card {
  -ms-overflow-style: none;
  /* IE 10+ */
}

/* 弹窗头部 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dialog-header h3 {
  font-weight: 700;
  color: #333;
  font-size: 1.3rem;
}

.close-btn {
  font-size: 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  color: #999;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #667eea;
}

/* 表单样式 */
.dialog-form label {
  display: block;
  margin-bottom: 18px;
  font-weight: 600;
  color: #555;
  font-size: 1rem;
}

.dialog-form input[type="text"] {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

.dialog-form input[type="text"]:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 5px rgba(102, 126, 234, 0.4);
}

/* 按钮区域 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 10px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 10px 24px;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: box-shadow 0.3s ease;
}

.btn-primary:hover {
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.5);
}

.btn-secondary {
  background: #f8f9fa;
  border: 2px solid #e1e5e9;
  color: #666;
  padding: 10px 24px;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: box-shadow 0.3s ease;
}

.btn-secondary:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 追加弹窗内多条目相关样式 */
.repo-item {
  margin-bottom: 15px;
  position: relative;
}

.repo-item label {
  display: block;
  margin-bottom: 8px;
}

.inline-remove-btn {
  position: static;
  margin-left: 12px;
  padding: 4px 10px;
  font-size: 0.85rem;
  border-radius: 8px;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  /* 加上过渡 */
  transition: background-color 0.3s ease, color 0.3s ease;
}

.inline-remove-btn:hover {
  background-color: #e0e0e0;
  color: #333;
}

/* 给名称 label 里内容水平排布 */
.repo-name-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #555;
  margin-bottom: 18px;
  font-size: 1rem;
}

.repo-name-label input[type="text"] {
  flex-grow: 1;
}

.add-btn {
  width: 100%;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* 动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.fade-in-item {
  opacity: 0;
  animation: fadeInItem 0.5s ease forwards;
}

@keyframes fadeInItem {
  to {
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .control-panel {
    position: static;
  }

  .header-content {
    padding: 30px 20px;
  }

  .logo h1 {
    font-size: 2rem;
  }

  .report-actions {
    flex-direction: column;
  }

  .action-btn {
    justify-content: center;
  }

  .report-meta {
    flex-direction: column;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .daily-report-container {
    padding: 15px;
  }

  .report-display,
  .control-panel {
    padding: 20px;
  }

  .logo {
    flex-direction: column;
    gap: 10px;
  }

  .logo h1 {
    font-size: 1.8rem;
  }
}
</style>
