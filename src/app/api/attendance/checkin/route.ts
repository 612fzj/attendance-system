import { NextRequest, NextResponse } from "next/server";
import { 
  getEmployeeById, 
  getAttendanceRule, 
  getTodayRecord, 
  upsertAttendanceRecord,
  calculateStatus
} from "@/lib/db/attendance";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      employee_id, 
      check_type, 
      location, 
      device_type 
    } = body;

    // 参数验证
    if (!employee_id || !check_type) {
      return NextResponse.json(
        { success: false, code: "INVALID_PARAMS", message: "缺少必要参数" },
        { status: 400 }
      );
    }

    if (!["check_in", "check_out"].includes(check_type)) {
      return NextResponse.json(
        { success: false, code: "INVALID_TYPE", message: "打卡类型错误" },
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

    // 获取考勤规则
    const rule = await getAttendanceRule(employee.department_id);
    if (!rule) {
      return NextResponse.json(
        { success: false, code: "NO_RULE", message: "未配置考勤规则" },
        { status: 400 }
      );
    }

    // 获取当日记录
    const todayRecord = await getTodayRecord(employee_id);
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // 业务逻辑判断
    if (check_type === "check_in") {
      if (todayRecord?.check_in_time) {
        return NextResponse.json({
          success: false,
          code: "ALREADY_CHECKED_IN",
          message: "您已经打过上班卡了",
          data: {
            existing_check_time: todayRecord.check_in_time
          }
        });
      }

      // 计算上班状态
      const statusResult = calculateStatus(now, rule, "check_in");
      
      // 创建记录
      const record = await upsertAttendanceRecord({
        employee_id,
        record_date: today,
        check_in_time: now.toISOString(),
        check_in_status: statusResult.status,
        location: location?.address,
        device_type
      });

      return NextResponse.json({
        success: true,
        code: statusResult.status === "normal" ? "CHECKIN_SUCCESS" : "CHECKIN_LATE",
        message: statusResult.status === "normal" ? "上班打卡成功" : "已打卡，您已迟到",
        data: {
          record_id: record.id,
          check_time: record.check_in_time,
          status: statusResult.status,
          status_text: statusResult.statusText,
          late_minutes: statusResult.minutes,
          threshold_minutes: rule.late_threshold_minutes,
          employee_name: employee.name
        }
      });

    } else {
      // check_out 下班打卡
      if (!todayRecord?.check_in_time) {
        return NextResponse.json({
          success: false,
          code: "NOT_CHECKED_IN",
          message: "请先进行上班打卡",
          data: {}
        });
      }

      if (todayRecord.check_out_time) {
        return NextResponse.json({
          success: false,
          code: "ALREADY_CHECKED_OUT",
          message: "您已经打过下班卡了",
          data: {
            existing_check_time: todayRecord.check_out_time
          }
        });
      }

      // 计算下班状态
      const statusResult = calculateStatus(now, rule, "check_out");

      // 计算工作时长
      const checkIn = new Date(todayRecord.check_in_time);
      const workMinutes = Math.floor((now.getTime() - checkIn.getTime()) / 60000);

      // 更新记录
      const record = await upsertAttendanceRecord({
        id: todayRecord.id,
        employee_id,
        record_date: today,
        check_out_time: now.toISOString(),
        check_out_status: statusResult.status,
        work_duration_minutes: workMinutes
      });

      return NextResponse.json({
        success: true,
        code: "CHECKOUT_SUCCESS",
        message: "下班打卡成功",
        data: {
          record_id: record.id,
          check_time: record.check_out_time,
          status: statusResult.status,
          status_text: statusResult.statusText,
          work_duration_minutes: workMinutes,
          work_duration_text: `${Math.floor(workMinutes / 60)}小时${workMinutes % 60}分钟`,
          employee_name: employee.name
        }
      });
    }

  } catch (error) {
    console.error("打卡错误:", error);
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
