<template>
  <div ref="root" class="date-picker">
    <button ref="trigger" class="date-trigger" type="button" :aria-expanded="open" aria-haspopup="dialog" @click="toggle">
      <svg class="trigger-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3m10-3v3M4 9h16M5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5Z" /></svg>
      <span>{{ displayDate }}</span><svg class="trigger-chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="m3 4.5 3 3 3-3" /></svg>
    </button>
    <div v-if="open" class="calendar" :class="{ above: openAbove }" role="dialog" aria-label="选择日期" @keydown.esc.stop="close(true)">
      <div class="calendar-header"><div class="calendar-title" aria-live="polite"><strong>{{ visibleMonth + 1 }}月</strong><span>{{ visibleYear }}</span></div><div class="calendar-navigation"><button type="button" aria-label="上个月" @click="changeMonth(-1)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m10 3.5-4.5 4.5 4.5 4.5" /></svg></button><button type="button" aria-label="下个月" @click="changeMonth(1)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3.5 4.5 4.5-4.5 4.5" /></svg></button></div></div>
      <div class="calendar-weekdays" aria-hidden="true"><span v-for="day in weekdays" :key="day">{{ day }}</span></div>
      <div class="calendar-grid" @keydown="handleGridKey">
        <button v-for="day in days" :key="day.value" type="button" :data-date="day.value" :tabindex="focusedDate === day.value ? 0 : -1" :aria-label="day.label" :aria-pressed="modelValue === day.value" :class="{ outside: !day.current, selected: modelValue === day.value, today: today === day.value }" @focus="focusedDate = day.value" @click="select(day.value)">{{ day.number }}</button>
      </div>
      <div class="calendar-footer"><span>选择日期</span><button type="button" @click="select(today)">今天</button></div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, onMounted, onUnmounted } from 'vue'
import { localDate } from '@/utils/report.js'

const props = defineProps({ modelValue: { type: String, required: true } })
const emit = defineEmits(['update:modelValue'])
const root = ref(null)
const trigger = ref(null)
const open = ref(false)
const openAbove = ref(false)
const visibleYear = ref(0)
const visibleMonth = ref(0)
const focusedDate = ref('')
const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const today = ref(localDate(new Date()))
const parseDate = value => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day) }
const displayDate = computed(() => { const date = parseDate(props.modelValue); return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日` })
const days = computed(() => {
  const first = new Date(visibleYear.value, visibleMonth.value, 1)
  const offset = (first.getDay() + 6) % 7
  const count = Math.ceil((offset + new Date(visibleYear.value, visibleMonth.value + 1, 0).getDate()) / 7) * 7
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(visibleYear.value, visibleMonth.value, 1 - offset + index)
    return { value: localDate(date), number: date.getDate(), current: date.getMonth() === visibleMonth.value, label: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日` }
  })
})
function focusDay(value) { nextTick(() => root.value?.querySelector(`[data-date="${value}"]`)?.focus()) }
function setView(date) { visibleYear.value = date.getFullYear(); visibleMonth.value = date.getMonth() }
function toggle(event) {
  if (open.value) return close(false)
  today.value = localDate(new Date())
  const date = parseDate(props.modelValue)
  setView(date); focusedDate.value = props.modelValue
  const bounds = trigger.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - bounds.bottom
  openAbove.value = spaceBelow < 410 && bounds.top > spaceBelow
  open.value = true
  if (event.detail === 0) focusDay(focusedDate.value)
}
function close(restoreFocus) { open.value = false; if (restoreFocus) nextTick(() => trigger.value?.focus()) }
function select(value) { emit('update:modelValue', value); close(true) }
function changeMonth(delta) {
  const date = new Date(visibleYear.value, visibleMonth.value + delta, 1)
  setView(date); focusedDate.value = localDate(date)
}
function handleGridKey(event) {
  const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key]
  if (delta === undefined) return
  event.preventDefault()
  const date = parseDate(focusedDate.value); date.setDate(date.getDate() + delta)
  setView(date); focusedDate.value = localDate(date); focusDay(focusedDate.value)
}
function outside(event) { if (open.value && !root.value?.contains(event.target)) close(false) }
onMounted(() => document.addEventListener('pointerdown', outside))
onUnmounted(() => document.removeEventListener('pointerdown', outside))
</script>

<style scoped>
.date-picker { position: relative; width: max-content; }
.date-trigger { display: flex; align-items: center; gap: 9px; padding: 8px 12px; border: 0; border-radius: 10px; background: #eff3f9; color: #35465c; font-size: 14px; font-weight: 500; cursor: pointer; }
.date-trigger:hover, .date-trigger[aria-expanded="true"] { background: #e8eef8; }
.date-trigger svg { fill: none; stroke-linecap: round; stroke-linejoin: round; }
.trigger-icon { width: 16px; height: 16px; stroke: #7990ae; stroke-width: 1.7; }
.trigger-chevron { width: 12px; height: 12px; margin-left: 3px; stroke: #93a2b4; stroke-width: 1.5; }
.calendar { position: absolute; top: calc(100% + 10px); left: 0; z-index: 5; width: 308px; padding: 20px 20px 15px; border-radius: 20px; background: #fff; box-shadow: 0 18px 48px rgba(43, 59, 81, .14), 0 3px 12px rgba(43, 59, 81, .05); }
.calendar.above { top: auto; bottom: calc(100% + 10px); }
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin: 0 0 19px; }
.calendar-title { display: flex; align-items: baseline; gap: 8px; }
.calendar-title strong { color: #263447; font-size: 20px; font-weight: 700; letter-spacing: -.4px; }
.calendar-title span { color: #99a6b6; font-size: 13px; font-weight: 500; }
.calendar-navigation { display: flex; gap: 6px; }
.calendar-header button { display: grid; place-items: center; width: 31px; height: 31px; padding: 0; border: 0; border-radius: 10px; background: #f5f7fa; color: #8291a3; cursor: pointer; }
.calendar-header button:hover { background: #eaf2fd; color: #1678ed; }
.calendar-header button svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.calendar-weekdays, .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; }
.calendar-weekdays { color: #a3afbd; font-size: 12px; font-weight: 500; margin-bottom: 8px; }
.calendar-weekdays span { padding: 4px 0; }
.calendar-grid { row-gap: 4px; }
.calendar-grid button { position: relative; justify-self: center; display: grid; place-items: center; width: 35px; height: 35px; padding: 0; border: 0; border-radius: 50%; background: none; color: #3d4c60; font-size: 14px; font-variant-numeric: tabular-nums; cursor: pointer; }
.calendar-grid button.outside { color: #c0cad5; }
.calendar-grid button.today:not(.selected)::after { content: ''; position: absolute; bottom: 3px; width: 4px; height: 4px; border-radius: 50%; background: #087df4; }
.calendar-grid button:hover:not(.selected) { background: #edf4fe; }
.calendar-grid button.selected { background: #087df4; color: #fff; font-weight: 600; }
.calendar-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; color: #a3afbd; font-size: 12px; }
.calendar-footer button { padding: 6px 10px; border: 0; border-radius: 9px; background: #eef5ff; color: #0877ea; font-size: 12px; font-weight: 600; cursor: pointer; }
.calendar-footer button:hover { background: #f1f6fe; }
</style>
