import { NextRequest, NextResponse } from "next/server";
import { 
  getEmployeeById, 
  getLeaveTypes,
  checkDateConflict,
  createLeaveRequest,
  getEmployeeQuotas 
} from "@/lib/db/leave";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      employee_id, 
      leave_type, 
      start_date, 
      end_date,
      start_half = "full",
      end_half = "full",
      reason 
    } = body;

    // 参数验证
    if (!employee_id || !leave_type || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, code: "INVALID_PARAMS", message: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 获取员工信息
    const employee = await getEmployeeById(employee_id);
    if (!employee) {
      return NextResponse.json(
        { success: false, code: "EMPLOYEE_NOT_FOUND", message: "员工不存在" },
        { status: 404 }
      );
    }

    // 获取请假类型配置
    const leaveTypes = await getLeaveTypes();
    const leaveType = leaveTypes.find(t => t.type_code === leave_type);
    
    if (!leaveType) {
      return NextResponse.json(
        { success: false, code: "INVALID_LEAVE_TYPE", message: "请假类型不存在" },
        { status: 400 }
      );
    }

    // 检查日期冲突
    const conflict = await checkDateConflict(employee_id, start_date, end_date);
    if (conflict) {
      return NextResponse.json({
        success: false,
        code: "DATE_CONFLICT",
        message: "该时段已有审批通过的请假",
        data: {
          conflicting_request: {
            id: conflict.id,
            type: leaveTypes.find(t => t.type_code === conflict.leave_type)?.type_name,
            dates: `${conflict.start_date} - ${conflict.end_date}`
          }
        }
      });
    }

    // 计算请假天数（简单计算，实际需要考虑节假日）
    const start = new Date(start_date);
    const end = new Date(end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 检查配额（如果需要）
    if (["annual", "sick", "personal"].includes(leave_type)) {
      const year = new Date().getFullYear();
      const quotas = await getEmployeeQuotas(employee_id, year);
      const quota = quotas.find(q => q.leave_type === leave_type);
      
      if (quota) {
        const remaining = quota.total_days - quota.used_days - quota.pending_days;
        if (remaining < days) {
          return NextResponse.json({
            success: false,
            code: "QUOTA_INSUFFICIENT",
            message: `${leaveType.type_name}余额不足`,
            data: {
              requested_days: days,
              remaining_days: remaining
            }
          });
        }
      }
    }

    // 获取审批人（部门负责人）
    // 简化处理：使用测试数据中的负责人
    const { data: approver } = await supabase
      .from("employees")
      .select("id")
      .eq("employee_no", "E003") // 默认技术总监审批
      .single();

    // 创建请假申请
    const leaveRequest = await createLeaveRequest({
      employee_id,
      leave_type,
      start_date,
      end_date,
      start_half,
      end_half,
      total_days: days,
      reason,
      status: "pending",
      approver_id: approver?.id
    });

    return NextResponse.json({
      success: true,
      code: "APPLY_SUCCESS",
      message: "请假申请已提交",
      data: {
        request_id: leaveRequest.id,
        leave_type: leaveType.type_name,
        start_date: leaveRequest.start_date,
        end_date: leaveRequest.end_date,
        total_days: leaveRequest.total_days,
        status: leaveRequest.status,
        approver: {
          id: approver?.id,
          name: "技术总监"
        }
      }
    });

  } catch (error) {
    console.error("请假申请错误:", error);
    return NextResponse.json(
      { 
        success: false, 
        code: "SERVER_ERROR", 
        message: error instanceof Error ? error.message : "服务器错误" 
      },
      { status: 500 }
    );
  }
}

// 引入 supabase
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
