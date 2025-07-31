import { createRouter, createWebHashHistory } from 'vue-router'
//导入组件
import LayoutVue from '@/components/views/layout/Layout.vue'
//定义路由关系
const routes = [
    {
        path: '/',
        name: 'Layout',
        component: LayoutVue,
    }
]
//创建路由器

const router = createRouter({
    history: createWebHashHistory(), // ✅ 改这里！
    routes
})
//导出路由
export default router