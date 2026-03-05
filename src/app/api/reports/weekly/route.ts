import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 获取本周开始日期（周一）
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    // 获取本周所有考勤记录
    const { data: records, error } = await supabase
      .from("attendance_records")
      .select(`
        id, employee_id, record_date,
        check_in_time, check_in_status, check_out_status, work_duration_minutes,
        employee:employees(id, name, employee_no)
      `)
      .gte("record_date", startStr)
      .lte("record_date", endStr);

    if (error) throw new Error(error.message);

    // 按员工分组统计
    const employeeStats = new Map();
    records?.forEach(r => {
      const empId = r.employee_id;
      if (!employeeStats.has(empId)) {
        employeeStats.set(empId, {
          name: (r as any).employee?.name,
          total_days: 0,
          normal_days: 0,
          late_days: 0,
          early_leave_days: 0,
          absent_days: 0,
          work_minutes: 0
        });
      }
      const stats = employeeStats.get(empId);
      stats.total_days++;
      if (r.check_in_status === "normal" && r.check_out_status === "normal") {
        stats.normal_days++;
      } else if (r.check_in_status === "late") {
        stats.late_days++;
      } else if (r.check_out_status === "early_leave") {
        stats.early_leave_days++;
      }
      if (r.check_in_status === "absent" || !r.check_in_time) {
        stats.absent_days++;
      }
      stats.work_minutes += r.work_duration_minutes || 0;
    });

    // 获取本周请假统计
    const { data: leaves } = await supabase
      .from("leave_requests")
      .select("employee_id, leave_type, total_days, status")
      .eq("status", "approved")
      .lte("start_date", endStr)
      .gte("end_date", startStr);

    const leaveStats = new Map();
    leaves?.forEach(l => {
      if (!leaveStats.has(l.employee_id)) {
        leaveStats.set(l.employee_id, 0);
      }
      leaveStats.set(l.employee_id, leaveStats.get(l.employee_id) + l.total_days);
    });

    const employeeList = Array.from(employeeStats.values()).map(e => ({
      ...e,
      work_hours: (e.work_minutes / 60).toFixed(1),
      leave_days: leaveStats.get(e.employee_id) || 0
    }));

    // 本周统计
    const totalWorkDays = employeeList.reduce((sum, e) => sum + e.total_days, 0);
    const totalNormal = employeeList.reduce((sum, e) => sum + e.normal_days, 0);
    const totalLate = employeeList.reduce((sum, e) => sum + e.late_days, 0);
    
    // 获取员工总数
    const { count: totalEmployees } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);
    
    // 本周请假总天数
    const totalLeaveDays = leaves?.reduce((sum, l) => sum + (l.total_days || 0), 0) || 0;
    
    // 分母：员工总数 - 请假天数
    const denominator = (totalEmployees || 0) - totalLeaveDays;
    // 分子：正常 + 迟到天数
    const numerator = totalNormal + totalLate;
    // 出勤率
    const attendanceRate = denominator > 0 
      ? ((numerator / denominator) * 100).toFixed(1) + "%" 
      : "0%";

    const result = {
      period: { start: startStr, end: endStr },
      week_num: getWeekNumber(today),
      summary: {
        total_employees: totalEmployees,
        total_work_days: totalWorkDays,
        normal_days: totalNormal,
        late_days: totalLate,
        leave_days: totalLeaveDays,
        attendance_rate: attendanceRate,
      },
      employees: employeeList
    };

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "错误" },
      { status: 500 }
    );
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
