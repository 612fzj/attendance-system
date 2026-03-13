import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

const DEFAULT_PASSWORD = "attendance2026";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { employee_id, old_password, new_password } = body;

    if (!employee_id || !old_password || !new_password) {
      return NextResponse.json({ success: false, message: "参数不完整" }, { status: 400 });
    }

    // 验证旧密码
    const { data: authRecord } = await supabase
      .from("employee_auth")
      .select("password_hash")
      .eq("employee_id", employee_id)
      .single();

    let isValidOldPassword = false;
    if (authRecord?.password_hash) {
      isValidOldPassword = authRecord.password_hash === old_password;
    } else {
      isValidOldPassword = old_password === DEFAULT_PASSWORD;
    }

    if (!isValidOldPassword) {
      return NextResponse.json({ success: false, message: "当前密码错误" }, { status: 401 });
    }

    // 更新密码
    const { error } = await supabase
      .from("employee_auth")
      .upsert({ employee_id, password_hash: new_password, updated_at: new Date().toISOString() });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, message: "密码修改成功" });

  } catch (error) {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 });
  }
}
