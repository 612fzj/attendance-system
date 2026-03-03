import { NextRequest, NextResponse } from "next/server";
import { 
  getEmployeeById, 
  updateLeaveStatus 
} from "@/lib/db/leave";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      request_id, 
      approver_id, 
      action, 
      comment 
    } = body;

    // 参数验证
    if (!request_id || !approver_id || !action) {
      return NextResponse.json(
        { success: false, code: "INVALID_PARAMS", message: "缺少必要参数" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, code: "INVALID_ACTION", message: "审批操作无效" },
        { status: 400 }
      );
    }

    // 获取审批人信息
    const approver = await getEmployeeById(approver_id);
    if (!approver) {
      return NextResponse.json(
        { success: false, code: "APPROVER_NOT_FOUND", message: "审批人不存在" },
        { status: 404 }
      );
    }

    // 执行审批
    const status = action === "approve" ? "approved" : "rejected";
    const updatedRequest = await updateLeaveStatus(request_id, status, approver_id, comment);

    return NextResponse.json({
      success: true,
      code: action === "approve" ? "APPROVE_SUCCESS" : "REJECT_SUCCESS",
      message: action === "approve" ? "审批通过" : "审批拒绝",
      data: {
        request_id: updatedRequest.id,
        status: updatedRequest.status,
        approved_at: updatedRequest.approved_at,
        approver_name: approver.name
      }
    });

  } catch (error) {
    console.error("审批错误:", error);
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
