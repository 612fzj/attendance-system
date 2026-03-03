"use client";

import { useState, useEffect } from "react";
import AttendanceCard from "@/components/AttendanceCard";

interface Employee {
  id: string;
  name: string;
  employee_no: string;
  position: string;
}

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEmployees(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">考勤打卡</h1>
        <p className="text-gray-600 mt-1">管理员工的上班和下班打卡</p>
      </div>

      <AttendanceCard employees={employees} />
    </div>
  );
}
