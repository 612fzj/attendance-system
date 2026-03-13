#!/bin/bash

# 考勤系统进程监控脚本
# 自动检测并重启服务

LOG_FILE="/tmp/attendance.log"
APP_DIR="/home/msi-nb/.openclaw/workspace/attendance-system"
PORT=3000

check_service() {
    curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/ 2>/dev/null
}

restart_service() {
    echo "[$(date)] 服务已停止，正在重启..." >> $LOG_FILE
    cd $APP_DIR
    nohup npm run dev > $LOG_FILE 2>&1 &
    sleep 5
    echo "[$(date)] 服务已启动" >> $LOG_FILE
}

echo "[$(date)] 监控脚本已启动" >> $LOG_FILE

while true; do
    status=$(check_service)
    
    if [ "$status" != "200" ]; then
        echo "[$(date)] 检测到服务异常 (HTTP $status)，正在重启..." >> $LOG_FILE
        
        # 杀掉旧的node进程
        pkill -f "next-server" 2>/dev/null
        pkill -f "next dev" 2>/dev/null
        sleep 2
        
        # 重启服务
        cd $APP_DIR
        nohup npm run dev > $LOG_FILE 2>&1 &
        sleep 8
    fi
    
    sleep 10
done