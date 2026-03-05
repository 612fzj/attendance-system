import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

// 获取可审批人员列表（可用于请假审批等）
export async function GET() {
  try {
    // 获取所有活跃员工，返回可能作为审批人
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, employee_no, position")
      .eq("is_active", true)
      .in("position", ["技术总监", "产品经理", "经理", "总监", "主管"])
      .limit(10);

    // 如果没有匹配到主管级别员工，返回所有员工
    if (!data || data.length === 0) {
      const { data: allEmployees } = await supabase
        .from("employees")
        .select("id, name, employee_no, position")
        .eq("is_active", true)
        .limit(10);
      
      return NextResponse.json({
        success: true,
        data: allEmployees || []
      });
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "错误" },
      { status: 500 }
    );
  }
}