import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

export async function GET() {
  try {
    const { data: rules, error } = await supabase
      .from("attendance_rules")
      .select(`
        id, rule_name, work_start_time, work_end_time, 
        flexible_minutes, late_threshold_minutes, early_leave_threshold_minutes,
        is_active, effective_date,
        department:departments(id, name)
      `)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data: rules || [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "错误" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      rule_name, department_id, work_start_time, work_end_time,
      flexible_minutes, late_threshold_minutes, early_leave_threshold_minutes 
    } = body;

    if (!rule_name || !work_start_time || !work_end_time) {
      return NextResponse.json(
        { success: false, message: "请填写必要的规则信息" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("attendance_rules")
      .insert({
        rule_name,
        department_id: department_id || null,
        work_start_time,
        work_end_time,
        flexible_minutes: flexible_minutes || 15,
        late_threshold_minutes: late_threshold_minutes || 30,
        early_leave_threshold_minutes: early_leave_threshold_minutes || 30,
        is_active: true,
        effective_date: new Date().toISOString().split("T")[0]
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "错误" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_active, ...updates } = body;

    const { data, error } = await supabase
      .from("attendance_rules")
      .update({ ...updates, is_active })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "错误" },
      { status: 500 }
    );
  }
}
