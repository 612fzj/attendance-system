"use client";

import { useState, useEffect } from "react";
import LeaveApplication from "@/components/LeaveApplication";

interface Employee {
  id: string;
  name: string;
  employee_no: string;
  position: string;
}

interface LeaveType {
  type_code: string;
  type_name: string;
}

export default function LeavePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/employees").then((res) => res.json()),
      fetch("/api/leave/types").then((res) => res.json()),
    ])
      .then(([empData, typeData]) => {
        if (empData.success) {
          setEmployees(empData.data);
        }
        
        // 从数据库获取请假类型
        if (typeData.success && typeData.data) {
          setLeaveTypes(typeData.data);
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
        <h1 className="text-2xl font-bold text-gray-900">请假管理</h1>
        <p className="text-gray-600 mt-1">提交和审批请假申请</p>
      </div>

      <LeaveApplication employees={employees} leaveTypes={leaveTypes} />
    </div>
  );
}
