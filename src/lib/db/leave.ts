import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  start_half?: string;
  end_half?: string;
  total_days: number;
  reason?: string;
  status: string;
  approver_id?: string;
  approved_at?: string;
  created_at: string;
}

export interface LeaveQuota {
  leave_type: string;
  total_days: number;
  used_days: number;
  remaining_days: number;
}

// 获取员工请假配额
export async function getEmployeeQuotas(employeeId: string, year: number) {
  const { data, error } = await supabase
    .from("leave_quotas")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("year", year);

  if (error) throw new Error(error.message);
  return data || [];
}

// 获取请假类型配置
export async function getLeaveTypes() {
  const { data, error } = await supabase
    .from("leave_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data || [];
}

// 检查日期是否冲突
export async function checkDateConflict(
  employeeId: string, 
  startDate: string, 
  endDate: string
): Promise<LeaveRequest | null> {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("status", "approved")
    .lte("start_date", endDate)
    .gte("end_date", startDate)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data;
}

// 创建请假申请
export async function createLeaveRequest(request: Partial<LeaveRequest>): Promise<LeaveRequest> {
  const { data, error } = await supabase
    .from("leave_requests")
    .insert(request)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// 更新请假状态
export async function updateLeaveStatus(
  requestId: string,
  status: string,
  approverId: string,
  remark?: string
): Promise<LeaveRequest> {
  const updates: any = {
    status,
    approver_id: approverId,
    approved_at: new Date().toISOString()
  };
  
  if (status === "approved") {
    updates.approved_remark = remark;
  } else if (status === "rejected") {
    updates.rejected_reason = remark;
  }

  const { data, error } = await supabase
    .from("leave_requests")
    .update(updates)
    .eq("id", requestId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// 获取员工请假记录
export async function getEmployeeLeaves(
  employeeId: string, 
  status?: string,
  year?: number
) {
  let query = supabase
    .from("leave_requests")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  
  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data || [];
}

// 获取待审批列表
export async function getPendingApprovals(approverId: string) {
  const { data, error } = await supabase
    .from("leave_requests")
    .select(`
      *,
      employee:employees!leave_requests_employee_id_fkey(
        id, name, employee_no, department_id, position
      )
    `)
    .eq("approver_id", approverId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

// 获取员工信息（从 attendance 模块复用）
export async function getEmployeeById(employeeId: string) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
