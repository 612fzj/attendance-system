import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select(`
        id, employee_no, name, position, phone, email, is_active, hire_date,
        department:departments(id, name)
      `)
      .order("employee_no");

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data: data || [] });
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
    const { employee_no, name, department_id, position, phone, email, hire_date } = body;

    if (!employee_no || !name) {
      return NextResponse.json(
        { success: false, message: "工号和姓名不能为空" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("employees")
      .insert({
        employee_no,
        name,
        department_id,
        position,
        phone,
        email,
        hire_date,
        is_active: true
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
    const { id, employee_no, name, department_id, position, phone, email, is_active } = body;

    const { data, error } = await supabase
      .from("employees")
      .update({ employee_no, name, department_id, position, phone, email, is_active })
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "缺少员工ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("employees")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "错误" },
      { status: 500 }
    );
  }
}
