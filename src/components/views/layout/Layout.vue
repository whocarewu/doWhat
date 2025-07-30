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
        <div class="panel-header">
          <h2><i class="fas fa-cog"></i> 生成设置</h2>
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
              <ul>
                <li v-for="(task, index) in currentReport.completed" :key="index"
                  :style="{ animationDelay: `${index * 0.1}s` }" class="fade-in-item">
                  {{ task }}
                </li>
              </ul>
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

// 部门名称映射
const departmentNames: Record<string, string> = {
  tech: '开发',
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
  const sinceDate = moment(reportDate.value).format('YYYY-MM-DD')
  const untilDate = moment(reportDate.value).add(1, 'days').format('YYYY-MM-DD')
  try {
    const res = await window.api.getGitLogs({
      author: '吴峻森',
      since: sinceDate,
      until: untilDate
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

        return `【${moment(log.date).format('YYYY-MM-DD')}】${filteredMessage}`;
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

// 生命周期
onMounted(() => {
  // 设置默认日期为今天
  const today = new Date().toISOString().split('T')[0]
  reportDate.value = today
})
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
