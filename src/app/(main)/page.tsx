"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Stat {
  label: string;
  value: string | number;
  color: string;
}

export default function Home() {
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        // 获取员工总数
        const employeesRes = await fetch("/api/employees");
        const employeesData = await employeesRes.json();
        const totalEmployees = employeesData.data?.length || 0;

        // 获取今日考勤数据（批量查询，一次请求）
        const batchRes = await fetch("/api/attendance/batch-query");
        const batchData = await batchRes.json();
        
        const todayRecords = batchData.data || [];
        const checkedIn = todayRecords.filter((r: any) => r.today?.check_in_time).length;
        const lateCount = todayRecords.filter((r: any) => r.today?.check_in_status === "late").length;

        // 获取请假中数量（待审批）
        const leavesRes = await fetch("/api/leave/pending");
        const leavesData = await leavesRes.json();
        const pendingLeaves = leavesData.data?.length || 0;

        setStats([
          { label: "员工总数", value: totalEmployees, color: "blue" },
          { label: "今日出勤", value: checkedIn, color: "green" },
          { label: "待审批", value: pendingLeaves, color: "purple" },
          { label: "迟到", value: lateCount, color: "red" },
        ]);
      } catch (error) {
        console.error("获取统计数据失败:", error);
        setStats([
          { label: "员工总数", value: 0, color: "blue" },
          { label: "今日出勤", value: 0, color: "green" },
          { label: "待审批", value: 0, color: "purple" },
          { label: "迟到", value: 0, color: "red" },
        ]);
      }
    }

    fetchStats();
  }, []);

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">考勤管理系统</h1>
        <p className="text-lg text-gray-600">企业级考勤管理与报表系统</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className={`w-12 h-12 ${colorMap[stat.color]} rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold`}>
              {stat.value}
            </div>
            <div className="text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/attendance" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-semibold mb-2">考勤打卡</h3>
            <p className="text-gray-600">上班/下班打卡，查看考勤记录</p>
          </div>
        </Link>
        
        <Link href="/leave" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">请假管理</h3>
            <p className="text-gray-600">提交请假申请</p>
          </div>
        </Link>

        <Link href="/leave/approval" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2">请假审批</h3>
            <p className="text-gray-600">审批员工请假申请</p>
          </div>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/attendance/detail" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">考勤查询</h3>
            <p className="text-gray-600">查看考勤明细和统计</p>
          </div>
        </Link>
        
        <Link href="/daily-report" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">工作日报</h3>
            <p className="text-gray-600">每日工作总结提交</p>
          </div>
        </Link>

        <Link href="/reports" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-2">报表统计</h3>
            <p className="text-gray-600">日周月报自动生成</p>
          </div>
        </Link>

        <Link href="/admin" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-4">🛠️</div>
            <h3 className="text-xl font-semibold mb-2">系统管理</h3>
            <p className="text-gray-600">员工管理、规则配置</p>
          </div>
        </Link>
      </div>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">系统状态</h2>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-gray-700">系统运行正常</span>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          数据库连接: Supabase | API状态: 正常
        </div>
      </div>
    </div>
  );
}
