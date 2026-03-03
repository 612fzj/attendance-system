"use client";

import { useState, useEffect } from "react";
import AttendanceQuery from "@/components/AttendanceQuery";

interface Employee {
  id: string;
  name: string;
  employee_no: string;
  position: string;
}

export default function AttendanceDetailPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">考勤查询</h1>
        <p className="text-gray-600 mt-1">查看员工考勤记录和统计</p>
      </div>

      <AttendanceQuery employees={employees} />
    </div>
  );
}
