import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

// 获取请假类型列表
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("leave_types")
      .select("type_code, type_name, default_days, requires_proof, min_days, max_days")
      .eq("is_active", true)
      .order("sort_order");

    if (error) throw new Error(error.message);

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