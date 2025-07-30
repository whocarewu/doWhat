//导入
import request from '@/utils/request.js'
export function test() {
    return request.get('/test');
}

export function getDo() {
    return request.get('http://localhost:3000/api/git/logs');
}