"use client";

import { useState, useEffect } from "react";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const endpoint = reportType === "daily" 
        ? "/api/reports/daily" 
        : "/api/reports/weekly";
      
      const res = await fetch(endpoint);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("获取报表失败:", error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">考勤报表</h1>
        <p className="text-gray-600 mt-1">查看日周月报统计数据</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setReportType("daily")}
          className={`px-4 py-2 rounded-md ${
            reportType === "daily" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          📅 日报
        </button>
        <button
          onClick={() => setReportType("weekly")}
          className={`px-4 py-2 rounded-md ${
            reportType === "weekly" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          📆 周报
        </button>
        <button
          onClick={() => setReportType("monthly")}
          className="px-4 py-2 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed"
          disabled
        >
          📆 月报（即将上线）
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : data && reportType === "daily" ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">📅 {data.date} 考勤日报</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.summary?.total_employees}</div>
              <div className="text-sm text-gray-600">员工总数</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{data.summary?.normal}</div>
              <div className="text-sm text-gray-600">正常</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{data.summary?.late}</div>
              <div className="text-sm text-gray-600">迟到</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{data.summary?.absent}</div>
              <div className="text-sm text-gray-600">缺卡</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{data.summary?.attendance_rate}</div>
              <div className="text-sm text-gray-600">出勤率</div>
            </div>
          </div>

          {data.exception_list?.length === 0 && data.on_leave?.length === 0 && (
            <div className="text-center text-green-500 py-4">✅ 今日全员正常！</div>
          )}
        </div>
      ) : data && reportType === "weekly" ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">📆 第{data.week_num}周 考勤周报 ({data.period?.start} ~ {data.period?.end})</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.summary?.total_work_days}</div>
              <div className="text-sm text-gray-600">出勤人次</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{data.summary?.normal_days}</div>
              <div className="text-sm text-gray-600">正常</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{data.summary?.late_days}</div>
              <div className="text-sm text-gray-600">迟到</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{data.summary?.attendance_rate}</div>
              <div className="text-sm text-gray-600">出勤率</div>
            </div>
          </div>

          <div className="text-center text-gray-500">点击员工可查看详情</div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">暂无数据</div>
      )}
    </div>
  );
}