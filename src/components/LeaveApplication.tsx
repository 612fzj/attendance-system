"use client";

import { useState } from "react";

interface Employee {
  id: string;
  name: string;
  employee_no: string;
}

interface LeaveApplicationProps {
  employees: Employee[];
  leaveTypes: { type_code: string; type_name: string }[];
}

export default function LeaveApplication({ employees, leaveTypes }: LeaveApplicationProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeId || !leaveType || !startDate || !endDate) {
      alert("请填写完整信息");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, message: "请求失败" });
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">📝 请假申请</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            员工
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">请选择...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employee_no})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            请假类型
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
          >
            <option value="">请选择...</option>
            {leaveTypes.map((type) => (
              <option key={type.type_code} value={type.type_code}>
                {type.type_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              开始日期
            </label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              结束日期
            </label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            原因
          </label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请输入请假原因..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? "提交中..." : "提交申请"}
        </button>
      </form>

      {result && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">结果：</h3>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
