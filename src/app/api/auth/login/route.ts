import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

const DEFAULT_PASSWORD = "attendance2026";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employee_no, password } = body;

    if (!employee_no || !password) {
      return NextResponse.json({ success: false, message: "请输入用户名和密码" }, { status: 400 });
    }

    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("id, employee_no, name, position, is_active")
      .eq("employee_no", employee_no)
      .single();

    if (empError || !employee) {
      return NextResponse.json({ success: false, message: "用户不存在" }, { status: 401 });
    }

    if (!employee.is_active) {
      return NextResponse.json({ success: false, message: "账号已被禁用" }, { status: 401 });
    }

    const { data: authRecord, error: authError } = await supabase
      .from("employee_auth")
      .select("password_hash")
      .eq("employee_id", employee.id)
      .maybeSingle();

    console.log("登录-查询employee_auth:", { authRecord, authError, employee_id: employee.id });

    let isValidPassword = false;
    if (authRecord?.password_hash) {
      isValidPassword = authRecord.password_hash === password;
    } else {
      isValidPassword = password === DEFAULT_PASSWORD;
    }

    if (!isValidPassword) {
      return NextResponse.json({ success: false, message: "用户名或密码错误" }, { status: 401 });
    }

    const token = Buffer.from(`${employee.id}:${Date.now()}`).toString("base64");

    return NextResponse.json({
      success: true,
      message: "登录成功",
      data: { token, employee: { id: employee.id, name: employee.name, employee_no: employee.employee_no, position: employee.position } }
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 });
  }
}
