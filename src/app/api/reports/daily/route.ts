import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

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
    const totalEmployees = records?.length || 0;
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

    const leaveTypeMap = new Map();
    const { data: types } = await supabase.from("leave_types").select("type_code, type_name");
    types?.forEach(t => leaveTypeMap.set(t.type_code, t.type_name));

    // 格式化结果
    const result = {
      date,
      summary: {
        total_employees: 3,
        checked_in: totalEmployees,
        normal: normalCount,
        late: lateCount,
        absent: absentCount,
        attendance_rate: totalEmployees > 0 ? ((normalCount / 3) * 100).toFixed(1) + "%" : "0%",
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
      })) || []
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
