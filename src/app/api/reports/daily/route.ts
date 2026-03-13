import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // 获取所有员工数量
    const { count: totalActiveEmployees } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // 获取当日所有考勤记录
    const { data: records, error } = await supabase
      .from("attendance_records")
      .select(`
        id,
        employee_id,
        record_date,
        check_in_time,
        check_out_time,
        check_in_status,
        check_out_status,
        work_duration_minutes,
        employee:employees(
          id, name, employee_no, position, department_id
        )
      `)
      .eq("record_date", date);

    if (error) throw new Error(error.message);

    // 统计
    const totalEmployees = totalActiveEmployees || 0;
    const normalCount = records?.filter(r => 
      r.check_in_status === "normal" && r.check_out_status === "normal"
    ).length || 0;
    const lateCount = records?.filter(r => r.check_in_status === "late").length || 0;
    const absentCount = records?.filter(r => 
      r.check_in_status === "absent" || !r.check_in_time
    ).length || 0;

    // 获取当日请假人员
    const { data: leaves } = await supabase
      .from("leave_requests")
      .select(`
        id,
        start_date,
        end_date,
        leave_type,
        employee:employees(name, employee_no)
      `)
      .eq("status", "approved")
      .lte("start_date", date)
      .gte("end_date", date);

    const leaveCount = leaves?.length || 0;

    // 分母：员工总数 - 请假人数
    const denominator = totalEmployees - leaveCount;
    // 分子：正常 + 迟到人数
    const numerator = normalCount + lateCount;
    // 出勤率 = (正常 + 迟到) / (总人数 - 请假) × 100%
    const attendanceRate = denominator > 0 
      ? ((numerator / denominator) * 100).toFixed(1) + "%" 
      : "0%";

    const leaveTypeMap = new Map();
    const { data: types } = await supabase.from("leave_types").select("type_code, type_name");
    types?.forEach(t => leaveTypeMap.set(t.type_code, t.type_name));

    // 获取所有员工（包含未打卡的）
    const { data: allEmployees } = await supabase
      .from("employees")
      .select("id, name, employee_no, position")
      .eq("is_active", true);

    // 构建员工考勤明细
    const employeeDetails = allEmployees?.map(emp => {
      const record = records?.find(r => r.employee_id === emp.id);
      const leave = leaves?.find(l => (l as any).employee_id === emp.id);
      
      let checkInStatus = 'absent';
      let checkInTime: string | null = null;
      if (record?.check_in_time) {
        // 使用中国时区
        checkInTime = new Date(record.check_in_time).toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'Asia/Shanghai'
        });
        checkInStatus = record.check_in_status || 'normal';
      }
      
      let checkOutStatus: string | null = null;
      let checkOutTime: string | null = null;
      if (record?.check_out_time) {
        checkOutTime = new Date(record.check_out_time).toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'Asia/Shanghai'
        });
        checkOutStatus = record.check_out_status || 'normal';
      }

      // 工时转换为小时
      const workDurationMinutes = record?.work_duration_minutes || null;
      const workDurationHours = workDurationMinutes ? (workDurationMinutes / 60).toFixed(1) : null;

      return {
        name: emp.name,
        employee_no: emp.employee_no,
        check_in_time: checkInTime,
        check_in_status: checkInStatus,
        check_out_time: checkOutTime,
        check_out_status: checkOutStatus,
        work_duration: workDurationHours ? `${workDurationHours}h` : null,
        is_on_leave: !!leave,
        leave_type: leave ? leaveTypeMap.get((leave as any).leave_type) : null
      };
    }) || [];

    // 格式化结果
    const result = {
      date,
      summary: {
        total_employees: totalEmployees,
        checked_in: records?.length || 0,
        normal: normalCount,
        late: lateCount,
        absent: absentCount,
        on_leave: leaveCount,
        attendance_rate: attendanceRate,
      },
      exception_list: records?.filter(r => 
        r.check_in_status !== "normal" || r.check_out_status !== "normal"
      ).map(r => ({
        name: (r as any).employee?.name,
        type: r.check_in_status !== "normal" ? "迟到" : "早退",
        detail: r.check_in_status === "late" ? "上班迟到" : "下班早退"
      })) || [],
      on_leave: leaves?.map(l => ({
        name: (l as any).employee?.name,
        type: leaveTypeMap.get((l as any).leave_type)
      })) || [],
      employee_details: employeeDetails
    };

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "错误" },
      { status: 500 }
    );
  }
}
