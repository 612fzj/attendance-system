"use client";

import { useState } from "react";

interface Employee {
  id: string;
  name: string;
  employee_no: string;
}

interface AttendanceCardProps {
  employees: Employee[];
}

export default function AttendanceCard({ employees }: AttendanceCardProps) {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async (checkType: "check_in" | "check_out") => {
    if (!selectedEmployee) {
      alert("请先选择员工");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: selectedEmployee,
          check_type: checkType,
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
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">👆 上班打卡</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择员工
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

        <button
          onClick={() => handleCheckIn("check_in")}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? "处理中..." : "上班打卡"}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">👇 下班打卡</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择员工
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

        <button
          onClick={() => handleCheckIn("check_out")}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? "处理中..." : "下班打卡"}
        </button>
      </div>

      {result && (
        <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">结果：</h3>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
