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
    ])
      .then(([empData]) => {
        if (empData.success) {
          setEmployees(empData.data);
        }
        
        // 静态请假类型
        setLeaveTypes([
          { type_code: "annual", type_name: "年假" },
          { type_code: "sick", type_name: "病假" },
          { type_code: "personal", type_name: "事假" },
          { type_code: "business", type_name: "出差" },
          { type_code: "marital", type_name: "婚假" },
        ]);
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
