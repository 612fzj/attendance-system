import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 服务端客户端
const supabase = createClient(supabaseUrl, serviceKey);

// 类型定义
export interface Employee {
  id: string;
  employee_no: string;
  name: string;
  department_id?: string;
  position?: string;
  channel_id?: string;
  channel_type?: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  record_date: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_status: string;
  check_out_status: string;
  work_duration_minutes?: number;
  location?: string;
  device_type?: string;
  remark?: string;
}

export interface AttendanceRule {
  id: string;
  work_start_time: string;
  work_end_time: string;
  flexible_minutes: number;
  late_threshold_minutes: number;
  early_leave_threshold_minutes: number;
}

// 获取员工信息
export async function getEmployeeById(employeeId: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .single();
  
  if (error) throw new Error(error.message);
  return data;
}

// 获取考勤规则
export async function getAttendanceRule(departmentId?: string): Promise<AttendanceRule | null> {
  // 先查部门规则
  let { data, error } = await supabase
    .from("attendance_rules")
    .select("*")
    .eq("department_id", departmentId || null)
    .eq("is_active", true)
    .single();

  // 如果没有部门规则，查全局规则
  if (!data) {
    ({ data, error } = await supabase
      .from("attendance_rules")
      .select("*")
      .is("department_id", null)
      .eq("is_active", true)
      .single());
  }

  if (error) throw new Error(error.message);
  return data;
}

// 获取当日考勤记录
export async function getTodayRecord(employeeId: string): Promise<AttendanceRecord | null> {
  const today = new Date().toISOString().split("T")[0];
  
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("record_date", today)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data;
}

// 创建/更新考勤记录
export async function upsertAttendanceRecord(record: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
  const { data, error } = await supabase
    .from("attendance_records")
    .upsert(record)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// 计算考勤状态
export function calculateStatus(
  checkTime: Date,
  rule: AttendanceRule,
  type: "check_in" | "check_out"
): { status: string; statusText: string; minutes: number } {
  const [workHour, workMin] = rule.work_start_time.split(":").map(Number);
  const [endHour, endMin] = rule.work_end_time.split(":").map(Number);
  
  const workTime = workHour * 60 + workMin;
  const endTime = endHour * 60 + endMin;
  const checkMinutes = checkTime.getHours() * 60 + checkTime.getMinutes();
  const flexMinutes = rule.flexible_minutes;
  
  if (type === "check_in") {
    const lateMinutes = checkMinutes - workTime - flexMinutes;
    if (lateMinutes <= 0) {
      return { status: "normal", statusText: "正常", minutes: 0 };
    } else if (lateMinutes <= rule.late_threshold_minutes) {
      return { status: "late", statusText: `迟到 ${lateMinutes} 分钟`, minutes: lateMinutes };
    } else {
      return { status: "late", statusText: `迟到 ${lateMinutes} 分钟`, minutes: lateMinutes };
    }
  } else {
    const earlyMinutes = endTime - checkMinutes;
    if (earlyMinutes <= 0) {
      return { status: "normal", statusText: "正常", minutes: 0 };
    } else if (earlyMinutes <= rule.early_leave_threshold_minutes) {
      return { status: "early_leave", statusText: `早退 ${earlyMinutes} 分钟`, minutes: earlyMinutes };
    } else {
      return { status: "early_leave", statusText: `早退 ${earlyMinutes} 分钟`, minutes: earlyMinutes };
    }
  }
}

// 获取员工考勤记录列表
export async function getAttendanceList(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("record_date", startDate)
    .lte("record_date", endDate)
    .order("record_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}
