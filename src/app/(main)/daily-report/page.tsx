"use client";

import { useState, useEffect } from "react";

interface Employee {
  id: string;
  name: string;
  employee_no: string;
}

export default function DailyReportPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [report, setReport] = useState<any>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee && date) {
      fetchReport();
    }
  }, [selectedEmployee, date]);

  const fetchEmployees = async () => {
    const res = await fetch("/api/employees");
    const data = await res.json();
    if (data.success) setEmployees(data.data);
  };

  const fetchReport = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("employee_id", selectedEmployee);
    params.append("date", date);
    
    const res = await fetch(`/api/reports/daily-work?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      setReport(data.data);
      setContent(data.data.content || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!selectedEmployee) {
      alert("请选择员工");
      return;
    }
    
    setSaving(true);
    const res = await fetch("/api/reports/daily-work", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id: selectedEmployee,
        report_date: date,
        report_type: "daily",
        content
      })
    });
    
    const data = await res.json();
    if (data.success) {
      alert("保存成功！");
      fetchReport();
    } else {
      alert("保存失败: " + data.message);
    }
    setSaving(false);
  };

  const handleConfirm = async () => {
    if (!report) return;
    
    const res = await fetch("/api/reports/daily-work", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_id: report.id, action: "confirm" })
    });
    
    const data = await res.json();
    if (data.success) {
      alert("已确认！");
      fetchReport();
    }
  };

  const handlePublish = async () => {
    if (!report) return;
    
    const res = await fetch("/api/reports/daily-work", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_id: report.id, action: "publish" })
    });
    
    const data = await res.json();
    if (data.success) {
      alert("发布成功！");
      fetchReport();
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { text: string; class: string }> = {
      draft: { text: "草稿", class: "bg-gray-100 text-gray-800" },
      pending_confirm: { text: "待确认", class: "bg-yellow-100 text-yellow-800" },
      confirmed: { text: "已确认", class: "bg-blue-100 text-blue-800" },
      published: { text: "已发布", class: "bg-green-100 text-green-800" }
    };
    const s = map[status] || map.draft;
    return <span className={`px-2 py-1 text-xs rounded-full ${s.class}`}>{s.text}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">工作日报</h1>
        <p className="text-gray-600 mt-1">提交每日工作总结</p>
      </div>

      {/* 选择员工和日期 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">员工</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">请选择...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.employee_no})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <div className="p-2">
              {report ? getStatusBadge(report.status) : <span className="text-gray-400">-</span>}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : selectedEmployee ? (
        <>
          {/* 工作内容编辑 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">工作内容</h2>
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-md resize-none"
              placeholder="请输入今日工作内容，例如：
1. 完成了XXX功能开发
2. 修复了XXX问题
3. 参加了XXX会议
4. 学习了XXX技术"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="mt-4 flex justify-between">
              <button
                onClick={handleSave}
                disabled={saving || !content}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存草稿"}
              </button>
              
              {report && report.status === "draft" && content && (
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  确认并提交
                </button>
              )}
              
              {report && report.status === "confirmed" && (
                <button
                  onClick={handlePublish}
                  className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                >
                  发布
                </button>
              )}
            </div>
          </div>

          {/* 提示信息 */}
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            <p>💡 使用说明：</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>每日填写工作内容，保存为草稿</li>
              <li>确认后信息不可修改，等待发布</li>
              <li>发布后周报和月报将自动汇总</li>
              <li>使用数字编号格式（如1. 2. 3.）方便统计</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">请选择员工和日期</div>
      )}
    </div>
  );
}
