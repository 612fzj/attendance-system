"use client";

import { useState, useEffect } from "react";

interface LeaveRequest {
  id: string;
  employee: {
    name: string;
    employee_no: string;
    position: string;
  };
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  created_at: string;
}

export default function LeaveApproval() {
  const [pendingList, setPendingList] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    fetchCurrentUser();
    fetchPendingList();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      // 获取当前用户（第一个有审批权限的用户）
      const res = await fetch("/api/leave/approvers");
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        // 默认使用第一个审批人
        setCurrentUserId(data.data[0].id);
      }
    } catch (error) {
      console.error("获取当前用户失败:", error);
    }
  };

  const fetchPendingList = async () => {
    try {
      const res = await fetch("/api/leave/pending");
      const data = await res.json();
      if (data.success) {
        setPendingList(data.data);
      }
    } catch (error) {
      console.error("获取失败:", error);
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    if (!currentUserId) {
      alert("无法获取当前用户信息");
      return;
    }
    setProcessing(id);
    try {
      const res = await fetch("/api/leave/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: id,
          approver_id: currentUserId,
          action: "approve",
          comment: "同意"
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("审批通过！");
        fetchPendingList();
      } else {
        alert("操作失败: " + data.message);
      }
    } catch (error) {
      alert("操作失败");
    }
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    const reason = prompt("请输入拒绝原因：");
    if (!reason) return;

    setProcessing(id);
    try {
      const res = await fetch("/api/leave/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: id,
          approver_id: currentUserId,
          action: "reject",
          comment: reason
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("已拒绝");
        fetchPendingList();
      } else {
        alert("操作失败: " + data.message);
      }
    } catch (error) {
      alert("操作失败");
    }
    setProcessing(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          📋 待审批请假 ({pendingList.length})
        </h2>

        {pendingList.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无待审批的请假申请</p>
        ) : (
          <div className="space-y-4">
            {pendingList.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">{item.employee?.name}</span>
                      <span className="text-sm text-gray-500">({item.employee?.employee_no})</span>
                      <span className="text-sm text-gray-400">{item.employee?.position}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded mr-2">
                        {item.leave_type}
                      </span>
                      <span>{item.start_date} ~ {item.end_date}</span>
                      <span className="ml-2">共 {item.total_days} 天</span>
                    </div>
                    {item.reason && (
                      <div className="mt-2 text-sm text-gray-500">
                        原因：{item.reason}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-gray-400">
                      申请时间：{new Date(item.created_at).toLocaleString("zh-CN")}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={processing === item.id}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md disabled:opacity-50"
                    >
                      同意
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      disabled={processing === item.id}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md disabled:opacity-50"
                    >
                      拒绝
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
