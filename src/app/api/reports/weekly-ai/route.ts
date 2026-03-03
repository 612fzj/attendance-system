import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

// 获取本周的日期范围
function getWeekRange(date: Date = new Date()) {
  const dayOfWeek = date.getDay();
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  return {
    start: startDate.toISOString().split("T")[0],
    end: endDate.toISOString().split("T")[0]
  };
}

// 使用 AI 总结周报（模拟，实际需要接入 Claude/OpenAI）
function summarizeWithAI(dailyReports: any[], employeeName: string, weekRange: { start: string, end: string }): string {
  // 收集所有日报内容
  const contents = dailyReports.map(r => `- ${r.report_date}: ${r.content}`).join("\n");
  
  // 模拟 AI 总结（实际应调用 Claude API）
  const summary = `📊 ${employeeName} 本周工作周报 (${weekRange.start} ~ ${weekRange.end})

【工作概览】
本周共提交 ${dailyReports.length} 篇日报，经过智能分析，主要工作如下：

【重点成果】
${contents.substring(0, 500)}${contents.length > 500 ? '...' : ''}

【建议】
1. 继续保持每日总结的习惯
2. 建议增加与团队的任务协同记录
3. 可适当增加技术学习方面的内容

---
💡 此周报由 AI 根据每日日报自动生成`;

  return summary;
}

// API: 生成周报
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employee_id, force_regenerate } = body;

    if (!employee_id) {
      return NextResponse.json({ success: false, message: "缺少员工ID" }, { status: 400 });
    }

    // 获取员工信息
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("id, name, employee_no")
      .eq("id", employee_id)
      .single();

    if (empError) throw new Error(empError.message);

    // 获取本周日期范围
    const weekRange = getWeekRange();

    // 获取本周已发布的日报
    const { data: dailyReports, error: reportError } = await supabase
      .from("work_reports")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("report_type", "daily")
      .gte("report_date", weekRange.start)
      .lte("report_date", weekRange.end)
      .eq("status", "published")
      .order("report_date");

    if (reportError) throw new Error(reportError.message);

    if (!dailyReports || dailyReports.length === 0) {
      return NextResponse.json({
        success: false,
        message: "本周没有已发布的日报，无法生成周报"
      });
    }

    // 使用 AI 总结
    const summary = summarizeWithAI(dailyReports, employee.name, weekRange);

    // 检查是否已存在周报
    const { data: existingReport } = await supabase
      .from("work_reports")
      .select("id")
      .eq("employee_id", employee_id)
      .eq("report_type", "weekly")
      .eq("report_date", weekRange.start)
      .single();

    let report;
    if (existingReport) {
      // 更新
      const { data, error } = await supabase
        .from("work_reports")
        .update({
          content: summary,
          summary: summary.substring(0, 200),
          status: "pending_confirm",
          updated_at: new Date().toISOString()
        })
        .eq("id", existingReport.id)
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
          report_date: weekRange.start,
          report_type: "weekly",
          content: summary,
          summary: summary.substring(0, 200),
          status: "pending_confirm"
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      report = data;
    }

    return NextResponse.json({
      success: true,
      data: {
        report_id: report.id,
        week_range: weekRange,
        daily_count: dailyReports.length,
        summary: summary
      },
      message: "周报生成成功"
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "错误" },
      { status: 500 }
    );
  }
}

// API: 获取周报
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get("employee_id");
    const week = searchParams.get("week"); // 可选，指定周

    if (!employee_id) {
      return NextResponse.json({ success: false, message: "缺少员工ID" }, { status: 400 });
    }

    let reportDate;
    if (week) {
      reportDate = week;
    } else {
      reportDate = getWeekRange().start;
    }

    const { data: report, error } = await supabase
      .from("work_reports")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("report_type", "weekly")
      .eq("report_date", reportDate)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: report || null
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "错误" },
      { status: 500 }
    );
  }
}
