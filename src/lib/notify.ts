/**
 * 飞书消息通知工具
 * 用于考勤系统的事件通知
 */

const FEISHU_WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL;

// 发送飞书消息
export async function sendFeishuMessage(message: string): Promise<boolean> {
  if (!FEISHU_WEBHOOK_URL) {
    console.log("飞书Webhook未配置，跳过通知");
    return false;
  }

  try {
    const response = await fetch(FEISHU_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msg_type: "text",
        content: { text: message }
      })
    });
    return response.ok;
  } catch (error) {
    console.error("飞书通知失败:", error);
    return false;
  }
}

// 发送考勤打卡通知
export async function notifyCheckin(employeeName: string, checkType: string, status: string) {
  const message = `📍 考勤打卡通知

员工：${employeeName}
类型：${checkType === "check_in" ? "上班打卡" : "下班打卡"}
状态：${status}

时间：${new Date().toLocaleString("zh-CN")}`;
  
  return sendFeishuMessage(message);
}

// 发送请假申请通知
export async function notifyLeaveApply(employeeName: string, leaveType: string, days: number) {
  const message = `📝 请假申请通知

员工：${employeeName}
类型：${leaveType}
天数：${days}天

请及时审批！`;
  
  return sendFeishuMessage(message);
}

// 发送请假审批通知
export async function notifyLeaveApproval(employeeName: string, status: string, approverName: string) {
  const message = `✅ 请假审批通知

员工：${employeeName}
审批结果：${status === "approved" ? "已批准" : "已拒绝"}
审批人：${approverName}

时间：${new Date().toLocaleString("zh-CN")}`;
  
  return sendFeishuMessage(message);
}
