import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

const DEFAULT_PASSWORD = "attendance2026";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employee_no, old_password, new_password } = body;

    if (!employee_no || !old_password || !new_password) {
      return NextResponse.json({ success: false, message: "参数不完整" }, { status: 400 });
    }

    // 先通过工号查找员工id
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("id")
      .eq("employee_no", employee_no)
      .single();

    if (empError || !employee) {
      return NextResponse.json({ success: false, message: "员工不存在" }, { status: 404 });
    }

    const employee_id = employee.id;

    // 验证旧密码 - 先尝试查询 employee_auth 表（使用 maybeSingle 避免无记录时报错）
    const { data: authRecord } = await supabase
      .from("employee_auth")
      .select("password_hash")
      .eq("employee_id", employee_id)
      .maybeSingle();

    // 如果查询失败或没有记录，使用默认密码验证
    let isValidOldPassword = false;
    if (authRecord?.password_hash) {
      isValidOldPassword = authRecord.password_hash === old_password;
    } else {
      // 如果没有密码记录，使用默认密码
      isValidOldPassword = old_password === DEFAULT_PASSWORD;
    }

    if (!isValidOldPassword) {
      return NextResponse.json({ success: false, message: "当前密码错误" }, { status: 401 });
    }

    // 更新密码 - 直接尝试插入，如果失败则更新
    const { error: insertError } = await supabase
      .from("employee_auth")
      .insert({ employee_id, password_hash: new_password });

    console.log("插入结果:", { insertError });

    // 如果插入失败（已经存在记录），则更新
    if (insertError) {
      console.log("插入失败，尝试更新...");
      const { error: updateError } = await supabase
        .from("employee_auth")
        .update({ password_hash: new_password, updated_at: new Date().toISOString() })
        .eq("employee_id", employee_id);
      console.log("更新结果:", { updateError });
    }

    return NextResponse.json({ success: true, message: "密码修改成功" });

  } catch (error) {
    console.error("修改密码错误:", error);
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 });
  }
}