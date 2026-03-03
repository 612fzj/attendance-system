import { NextRequest, NextResponse } from "next/server";
import { 
  getEmployeeById, 
  getAttendanceList,
  getTodayRecord 
} from "@/lib/db/attendance";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get("employee_id");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    // 参数验证
    if (!employee_id) {
      return NextResponse.json(
        { success: false, code: "INVALID_PARAMS", message: "缺少员工ID" },
        { status: 400 }
      );
    }

    // 获取员工信息
    const employee = await getEmployeeById(employee_id);
    if (!employee) {
      return NextResponse.json(
        { success: false, code: "EMPLOYEE_NOT_FOUND", message: "员工不存在" },
        { status: 404 }
      );
    }

    // 默认查询本周
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(today.getDate() - today.getDay() + 1);
    
    const queryStart = start_date || defaultStart.toISOString().split("T")[0];
    const queryEnd = end_date || today.toISOString().split("T")[0];

    // 获取考勤记录
    const records = await getAttendanceList(employee_id, queryStart, queryEnd);

    // 获取今日记录
    const todayRecord = await getTodayRecord(employee_id);

    // 统计
    const stats = {
      total_days: records.length,
      normal_days: records.filter(r => 
        r.check_in_status === "normal" && r.check_out_status === "normal"
      ).length,
      late_days: records.filter(r => r.check_in_status === "late").length,
      early_leave_days: records.filter(r => r.check_out_status === "early_leave").length,
      absent_days: records.filter(r => 
        r.check_in_status === "absent" || r.check_out_status === "absent"
      ).length,
      total_work_minutes: records.reduce((sum, r) => sum + (r.work_duration_minutes || 0), 0)
    };

    // 格式化记录
    const formattedRecords = records.map(r => {
      const checkInTime = r.check_in_time 
        ? new Date(r.check_in_time).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
        : null;
      const checkOutTime = r.check_out_time 
        ? new Date(r.check_out_time).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
        : null;
      
      let status = "正常";
      if (r.check_in_status === "late") status = "迟到";
      if (r.check_out_status === "early_leave") status = status === "迟到" ? "迟到+早退" : "早退";
      if (!r.check_in_time || !r.check_out_time) status = "缺卡";

      return {
        date: r.record_date,
        weekday: new Date(r.record_date + "T00:00:00").toLocaleDateString("zh-CN", { weekday: "short" }),
        check_in_time: checkInTime,
        check_in_status: r.check_in_status === "normal" ? "正常" : r.check_in_status === "late" ? "迟到" : "缺卡",
        check_out_time: checkOutTime,
        check_out_status: r.check_out_status === "normal" ? "正常" : r.check_out_status === "early_leave" ? "早退" : "缺卡",
        work_duration: r.work_duration_minutes 
          ? `${Math.floor(r.work_duration_minutes / 60)}小时${r.work_duration_minutes % 60}分钟`
          : null,
        status
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          name: employee.name,
          employee_no: employee.employee_no,
          position: employee.position
        },
        period: {
          start: queryStart,
          end: queryEnd
        },
        records: formattedRecords,
        today: todayRecord ? {
          check_in_time: todayRecord.check_in_time 
            ? new Date(todayRecord.check_in_time).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
            : null,
          check_out_time: todayRecord.check_out_time
            ? new Date(todayRecord.check_out_time).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
            : null,
          check_in_status: todayRecord.check_in_status,
          check_out_status: todayRecord.check_out_status
        } : null,
        summary: {
          total_days: stats.total_days,
          normal_days: stats.normal_days,
          late_days: stats.late_days,
          early_leave_days: stats.early_leave_days,
          absent_days: stats.absent_days,
          total_work_hours: (stats.total_work_minutes / 60).toFixed(1)
        }
      }
    });

  } catch (error) {
    console.error("查询错误:", error);
    return NextResponse.json(
      { 
        success: false, 
        code: "SERVER_ERROR", 
        message: error instanceof Error ? error.message : "服务器错误" 
      },
      { status: 500 }
    );
  }
}
