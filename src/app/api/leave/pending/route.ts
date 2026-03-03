import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("leave_requests")
      .select(`
        id,
        employee_id,
        leave_type,
        start_date,
        end_date,
        total_days,
        reason,
        status,
        created_at,
        employee:employees!leave_requests_employee_id_fkey(
          id, name, employee_no, position
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    // 获取请假类型
    const { data: leaveTypes } = await supabase.from("leave_types").select("type_code, type_name");
    const typeMap = new Map(leaveTypes?.map(t => [t.type_code, t.type_name]));

    // 格式化数据
    const formatted = (data || []).map((item: any) => ({
      id: item.id,
      employee: item.employee,
      leave_type: typeMap.get(item.leave_type) || item.leave_type,
      start_date: item.start_date,
      end_date: item.end_date,
      total_days: item.total_days,
      reason: item.reason,
      created_at: item.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "错误" },
      { status: 500 }
    );
  }
}
