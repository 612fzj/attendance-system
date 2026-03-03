import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

// 获取或创建报告
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get("employee_id");
    const report_type = searchParams.get("report_type") || "daily";
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!employee_id) {
      return NextResponse.json({ success: false, message: "缺少员工ID" }, { status: 400 });
    }

    // 尝试获取现有的报告
    let { data: report, error } = await supabase
      .from("work_reports")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("report_date", date)
      .eq("report_type", report_type)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }

    // 如果不存在，创建新的草稿
    if (!report) {
      const { data: newReport, error: insertError } = await supabase
        .from("work_reports")
        .insert({
          employee_id,
          report_date: date,
          report_type,
          content: "",
          status: "draft"
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);
      report = newReport;
    }

    // 获取员工信息
    const { data: employee } = await supabase
      .from("employees")
      .select("name, employee_no, position")
      .eq("id", employee_id)
      .single();

    return NextResponse.json({
      success: true,
      data: { ...report, employee }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "错误" },
      { status: 500 }
    );
  }
}

// 保存报告
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employee_id, report_date, report_type, content, items } = body;

    if (!employee_id || !report_date || !content) {
      return NextResponse.json(
        { success: false, message: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const { data: existing } = await supabase
      .from("work_reports")
      .select("id")
      .eq("employee_id", employee_id)
      .eq("report_date", report_date)
      .eq("report_type", report_type || "daily")
      .single();

    let report;
    if (existing) {
      // 更新
      const { data, error } = await supabase
        .from("work_reports")
        .update({ 
          content, 
          status: "draft",
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      report = data;
    } else {
      // 创建
      const { data, error } = await supabase
        .from("work_reports")
        .insert({
          employee_id,
          report_date,
          report_type: report_type || "daily",
          content,
          status: "draft"
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      report = data;
    }

    // 保存工作明细
    if (items && items.length > 0) {
      await supabase
        .from("work_report_items")
        .delete()
        .eq("report_id", report.id);
      
      const itemData = items.map((item: any, index: number) => ({
        report_id: report.id,
        item_type: item.type || "general",
        item_content: item.content,
        hours: item.hours || 0,
        sort_order: index
      }));
      
      await supabase.from("work_report_items").insert(itemData);
    }

    return NextResponse.json({
      success: true,
      data: report,
      message: "保存成功"
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "错误" },
      { status: 500 }
    );
  }
}

// 提交确认
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { report_id, action } = body; // action: confirm (确认) / publish (发布)

    if (!report_id || !action) {
      return NextResponse.json(
        { success: false, message: "缺少必要参数" },
        { status: 400 }
      );
    }

    let updates: any = { updated_at: new Date().toISOString() };
    
    if (action === "confirm") {
      updates.status = "confirmed";
      updates.confirmed_at = new Date().toISOString();
    } else if (action === "publish") {
      updates.status = "published";
      updates.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("work_reports")
      .update(updates)
      .eq("id", report_id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      data,
      message: action === "confirm" ? "已确认，等待发布" : "发布成功"
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "错误" },
      { status: 500 }
    );
  }
}
