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
        <div className="space-y-6">
          {/* 日统计概要 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">📅 {data.date} 考勤日报</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{data.summary?.total_employees}</div>
                <div className="text-sm text-gray-600">员工总数</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{data.summary?.checked_in || 0}</div>
                <div className="text-sm text-gray-600">已打卡</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{data.summary?.normal}</div>
                <div className="text-sm text-gray-600">正常</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{data.summary?.late}</div>
                <div className="text-sm text-gray-600">迟到</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{data.summary?.on_leave || 0}</div>
                <div className="text-sm text-gray-600">请假</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{data.summary?.attendance_rate}</div>
                <div className="text-sm text-gray-600">出勤率</div>
              </div>
            </div>

            {/* 异常考勤列表 */}
            {data.exception_list?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">⚠️ 异常考勤</h3>
                <div className="space-y-2">
                  {data.exception_list.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                      <span className="text-red-600 font-medium">{item.name}</span>
                      <span className="text-gray-500">- {item.type}: {item.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 请假人员列表 */}
            {data.on_leave?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">📝 请假人员</h3>
                <div className="space-y-2">
                  {data.on_leave.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                      <span className="text-purple-600 font-medium">{item.name}</span>
                      <span className="text-gray-500">- {item.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.exception_list?.length === 0 && data.on_leave?.length === 0 && (
              <div className="text-center text-green-500 py-4">✅ 今日全员正常！</div>
            )}
          </div>

          {/* 员工考勤明细 */}
          {data.employee_details && data.employee_details.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-md font-semibold mb-4">📊 员工考勤明细</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">员工</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">上班时间</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">上班状态</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">下班时间</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">下班状态</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">工时(分钟)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.employee_details.map((emp: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{emp.check_in_time || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          {emp.check_in_status === 'normal' && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">正常</span>
                          )}
                          {emp.check_in_status === 'late' && (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">迟到</span>
                          )}
                          {!emp.check_in_time && (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">缺卡</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{emp.check_out_time || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          {emp.check_out_status === 'normal' && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">正常</span>
                          )}
                          {emp.check_out_status === 'early_leave' && (
                            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">早退</span>
                          )}
                          {!emp.check_out_time && (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{emp.work_duration || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : data && reportType === "weekly" ? (
        <div className="space-y-6">
          {/* 周统计概要 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">📆 第{data.week_num}周 考勤周报 ({data.period?.start} ~ {data.period?.end})</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{data.summary?.total_employees}</div>
                <div className="text-sm text-gray-600">员工总数</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{data.summary?.total_work_days}</div>
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
                <div className="text-2xl font-bold text-purple-600">{data.summary?.leave_days || 0}</div>
                <div className="text-sm text-gray-600">请假</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{data.summary?.attendance_rate}</div>
                <div className="text-sm text-gray-600">出勤率</div>
              </div>
            </div>
          </div>

          {/* 员工考勤明细 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-md font-semibold mb-4">📊 员工考勤明细</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">员工</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">出勤天数</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">正常</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">迟到</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">早退</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">缺卡</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">请假</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">工时(小时)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.employees?.map((emp: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{emp.total_days}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">{emp.normal_days}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">{emp.late_days}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">{emp.early_leave_days}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">{emp.absent_days}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">{emp.leave_days || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{emp.work_hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">暂无数据</div>
      )}
    </div>
  );
}