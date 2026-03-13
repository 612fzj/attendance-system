"use client";

import { useState, useEffect } from "react";

interface Employee {
  id: string;
  name: string;
  employee_no: string;
  position: string;
}

interface AttendanceRecord {
  date: string;
  weekday: string;
  check_in_time: string | null;
  check_in_status: string;
  check_out_time: string | null;
  check_out_status: string;
  work_duration: string | null;
  status: string;
}

interface AttendanceQueryProps {
  employees: Employee[];
}

export default function AttendanceQuery({ employees }: AttendanceQueryProps) {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 设置默认日期范围（本月）
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  }, []);

  const handleQuery = async () => {
    if (!selectedEmployee) {
      alert("请选择员工");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("employee_id", selectedEmployee);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const res = await fetch(`/api/attendance/query?${params.toString()}`);
      const result = await res.json();
      setData(result.data);
    } catch (error) {
      console.error("查询失败:", error);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "正常": return "text-green-600";
      case "迟到": return "text-yellow-600";
      case "早退": return "text-orange-600";
      case "缺卡": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* 查询条件 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🔍 查询条件</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              员工
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
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

        <button
          onClick={handleQuery}
          disabled={loading}
          className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? "查询中..." : "查询"}
        </button>
      </div>

      {/* 查询结果 */}
      {data && (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{data.summary?.total_days || 0}</div>
              <div className="text-sm text-gray-600">应出勤</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{data.summary?.normal_days || 0}</div>
              <div className="text-sm text-gray-600">正常</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{data.summary?.late_days || 0}</div>
              <div className="text-sm text-gray-600">迟到</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{data.summary?.early_leave_days || 0}</div>
              <div className="text-sm text-gray-600">早退</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{data.summary?.total_work_hours || 0}</div>
              <div className="text-sm text-gray-600">工时</div>
            </div>
          </div>

          {/* 考勤记录表格 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 考勤明细</h3>
            
            {data.records && data.records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">日期</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">上班</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">下班</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">时长</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.records.map((record: AttendanceRecord, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">
                          {record.date}
                          <span className="ml-2 text-gray-400 text-xs">{record.weekday}</span>
                        </td>
                        <td className="px-4 py-2 text-sm">{record.check_in_time || '-'}</td>
                        <td className="px-4 py-2 text-sm">{record.check_out_time || '-'}</td>
                        <td className="px-4 py-2 text-sm">{record.work_duration || '-'}</td>
                        <td className={`px-4 py-2 text-sm font-medium ${getStatusColor(record.status)}`}>
                          {record.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">暂无考勤记录</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
