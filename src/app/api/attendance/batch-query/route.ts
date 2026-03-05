import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

// 批量获取所有员工今日考勤
export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];
    
    // 1. 获取所有活跃员工
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, employee_no, name, position, department_id")
      .eq("is_active", true);

    if (empError) throw new Error(empError.message);

    // 2. 获取所有员工的今日考勤记录
    const employeeIds = employees?.map(e => e.id) || [];
    
    let records: any[] = [];
    if (employeeIds.length > 0) {
      const { data: attendanceRecords, error: attError } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("record_date", today)
        .in("employee_id", employeeIds);

      if (attError) throw new Error(attError.message);
      records = attendanceRecords || [];
    }

    // 3. 构建返回数据
    const result = employees?.map(emp => {
      const record = records.find(r => r.employee_id === emp.id);
      return {
        employee: emp,
        today: record ? {
          check_in_time: record.check_in_time,
          check_in_status: record.check_in_status,
          check_out_time: record.check_out_time,
          check_out_status: record.check_out_status,
          work_duration_minutes: record.work_duration_minutes
        } : null
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("批量查询错误:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    );
  }
}