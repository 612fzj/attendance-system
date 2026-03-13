-- =====================================================
-- 考勤管理系统 - 数据库初始化脚本
-- 执行方式：Supabase SQL Editor
-- =====================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 部门表
-- =====================================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    parent_id UUID REFERENCES departments(id),
    manager_id UUID,
    description VARCHAR(200),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_departments_parent ON departments(parent_id);
CREATE INDEX idx_departments_manager ON departments(manager_id);

-- =====================================================
-- 2. 员工表
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    department_id UUID REFERENCES departments(id),
    position VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    channel_id VARCHAR(100),        -- 通讯渠道ID（飞书open_id等）
    channel_type VARCHAR(20),       -- feishu/wx/telegram
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    hire_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_employees_dept ON employees(department_id);
CREATE INDEX idx_employees_channel ON employees(channel_id, channel_type);
CREATE INDEX idx_employees_no ON employees(employee_no);

-- =====================================================
-- 3. 考勤规则表
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id),  -- NULL表示全局规则
    rule_name VARCHAR(50) NOT NULL,
    work_start_time TIME NOT NULL DEFAULT '09:00:00',
    work_end_time TIME NOT NULL DEFAULT '18:00:00',
    flexible_minutes INT DEFAULT 15,                -- 弹性时间
    late_threshold_minutes INT DEFAULT 30,          -- 迟到阈值
    early_leave_threshold_minutes INT DEFAULT 30,   -- 早退阈值
    require_location BOOLEAN DEFAULT FALSE,
    max_radius_meters INT DEFAULT 500,
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES employees(id)
);

-- =====================================================
-- 4. 考勤记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    check_in_status VARCHAR(20) DEFAULT 'normal' CHECK (check_in_status IN ('normal', 'late', 'absent')),
    check_out_status VARCHAR(20) DEFAULT 'normal' CHECK (check_out_status IN ('normal', 'early_leave', 'absent')),
    work_duration_minutes INT,
    location VARCHAR(200),
    device_type VARCHAR(20),
    check_in_device VARCHAR(50),
    check_out_device VARCHAR(50),
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(employee_id, record_date)
);

-- 索引
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, record_date);
CREATE INDEX idx_attendance_date ON attendance_records(record_date);
CREATE INDEX idx_attendance_status ON attendance_records(check_in_status, check_out_status);

-- =====================================================
-- 5. 补卡申请表
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_remedies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    record_id UUID REFERENCES attendance_records(id),
    remedy_date DATE NOT NULL,
    remedy_type VARCHAR(20) CHECK (remedy_type IN ('check_in', 'check_out', 'both')),
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approver_id UUID REFERENCES employees(id),
    approved_at TIMESTAMPTZ,
    approved_remark VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_remedy_employee ON attendance_remedies(employee_id);
CREATE INDEX idx_remedy_status ON attendance_remedies(status);

-- =====================================================
-- 6. 请假类型配置表
-- =====================================================
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_code VARCHAR(20) UNIQUE NOT NULL,
    type_name VARCHAR(50) NOT NULL,
    type_name_en VARCHAR(50),
    default_days DECIMAL(5,1),
    requires_proof BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT TRUE,
    min_days DECIMAL(3,1) DEFAULT 0.5,
    max_days DECIMAL(5,1),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初始化请假类型数据
INSERT INTO leave_types (type_code, type_name, default_days, requires_proof, min_days, max_days, sort_order) VALUES
('annual', '年假', 15, FALSE, 0.5, 30, 1),
('sick', '病假', 10, TRUE, 0.5, 30, 2),
('personal', '事假', 5, FALSE, 0.5, 15, 3),
('business', '出差', NULL, FALSE, 0.5, NULL, 4),
('marital', '婚假', 3, FALSE, 1, 10, 5),
('maternity', '产假', 98, TRUE, 1, 180, 6),
('paternity', '陪产假', 7, FALSE, 1, 15, 7),
('bereavement', '丧假', 3, FALSE, 1, 7, 8)
ON CONFLICT (type_code) DO NOTHING;

-- =====================================================
-- 7. 员工请假配额表
-- =====================================================
CREATE TABLE IF NOT EXISTS leave_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    leave_type VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    total_days DECIMAL(5,1) NOT NULL DEFAULT 0,
    used_days DECIMAL(5,1) DEFAULT 0,
    pending_days DECIMAL(5,1) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(employee_id, leave_type, year)
);

CREATE INDEX idx_quota_employee_year ON leave_quotas(employee_id, year);

-- =====================================================
-- 8. 请假申请表
-- =====================================================
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    leave_type VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_half VARCHAR(10) CHECK (start_half IN ('AM', 'PM', 'full')),
    end_half VARCHAR(10) CHECK (end_half IN ('AM', 'PM', 'full')),
    total_days DECIMAL(5,1) NOT NULL,
    reason TEXT,
    attachments JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approver_id UUID REFERENCES employees(id),
    approval_level INT DEFAULT 1,
    approved_at TIMESTAMPTZ,
    approved_remark VARCHAR(200),
    rejected_reason TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_leave_employee_status ON leave_requests(employee_id, status);
CREATE INDEX idx_leave_approver_status ON leave_requests(approver_id, status);
CREATE INDEX idx_leave_dates ON leave_requests(start_date, end_date);

-- =====================================================
-- 9. 请假审批记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS leave_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES leave_requests(id),
    approver_id UUID NOT NULL REFERENCES employees(id),
    level INT NOT NULL DEFAULT 1,
    action VARCHAR(20) NOT NULL CHECK (action IN ('approve', 'reject', 'forward')),
    comment VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_request ON leave_approvals(request_id);

-- =====================================================
-- 10. 员工考勤统计表（按月）
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    stat_year INT NOT NULL,
    stat_month INT NOT NULL,
    department_id UUID REFERENCES departments(id),
    
    -- 出勤统计
    total_work_days INT DEFAULT 0,
    actual_work_days INT DEFAULT 0,
    normal_days INT DEFAULT 0,
    late_count INT DEFAULT 0,
    late_minutes_total INT DEFAULT 0,
    early_leave_count INT DEFAULT 0,
    early_leave_minutes_total INT DEFAULT 0,
    absent_days INT DEFAULT 0,
    missing_card_count INT DEFAULT 0,
    
    -- 工时统计
    total_work_minutes INT DEFAULT 0,
    overtime_minutes INT DEFAULT 0,
    overtime_days DECIMAL(5,1) DEFAULT 0,
    
    -- 请假统计
    leave_annual_days DECIMAL(5,1) DEFAULT 0,
    leave_sick_days DECIMAL(5,1) DEFAULT 0,
    leave_personal_days DECIMAL(5,1) DEFAULT 0,
    leave_business_days DECIMAL(5,1) DEFAULT 0,
    leave_other_days DECIMAL(5,1) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(employee_id, stat_year, stat_month)
);

CREATE INDEX idx_statistics_employee_ym ON attendance_statistics(employee_id, stat_year, stat_month);

-- =====================================================
-- 11. 报表配置表
-- =====================================================
CREATE TABLE IF NOT EXISTS report_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(30) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'department', 'exception')),
    report_name VARCHAR(50) NOT NULL,
    description TEXT,
    cron_expr VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    recipients JSONB,
    recipient_channels JSONB,
    filter_rules JSONB,
    content_template TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    last_run_status VARCHAR(20),
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_config_type ON report_configs(report_type, is_active);

-- =====================================================
-- 12. 报表发送记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS report_sends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id UUID NOT NULL REFERENCES report_configs(id),
    report_type VARCHAR(30) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    send_at TIMESTAMPTZ DEFAULT NOW(),
    recipient_count INT,
    success_count INT,
    failed_count INT,
    failure_reasons JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 测试数据：插入一个部门
-- =====================================================
INSERT INTO departments (name, description) VALUES 
('技术部', '技术研发部门')
ON CONFLICT DO NOTHING;

-- 获取刚插入的部门ID
DO $$
DECLARE 
    dept_id UUID;
BEGIN
    SELECT id INTO dept_id FROM departments WHERE name = '技术部' LIMIT 1;
    
    -- 插入测试员工
    INSERT INTO employees (employee_no, name, department_id, position, channel_type) VALUES
    ('E001', '张三', dept_id, '工程师', 'feishu'),
    ('E002', '李四', dept_id, '高级工程师', 'feishu'),
    ('E003', '王五', dept_id, '技术总监', 'feishu')
    ON CONFLICT (employee_no) DO NOTHING;
END $$;

-- =====================================================
-- 创建默认考勤规则
-- =====================================================
INSERT INTO attendance_rules (rule_name, work_start_time, work_end_time, flexible_minutes, is_active)
VALUES ('默认规则', '09:00:00', '18:00:00', 15, TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 创建默认报表配置
-- =====================================================
INSERT INTO report_configs (report_type, report_name, description, cron_expr, is_active, recipients)
VALUES 
('daily', '每日考勤汇总', '每日下班后发送考勤汇总', '0 17:30 * * *', TRUE, '{"type":"role","roles":["hr","manager"]}'),
('weekly', '每周考勤周报', '每周一发送周报', '0 9:00 * * 1', TRUE, '{"type":"all"}'),
('monthly', '每月考勤月报', '每月1日发送月报', '0 9:00 1 * *', TRUE, '{"type":"all"}')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 打印结果
-- =====================================================
SELECT '数据库初始化完成！' AS status;
SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = 'public';
-- =====================================================
-- 工作日报周报月报表
-- =====================================================
CREATE TABLE IF NOT EXISTS work_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    report_date DATE NOT NULL,
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
    content TEXT,
    summary TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_confirm', 'confirmed', 'published')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    
    UNIQUE(employee_id, report_date, report_type)
);

CREATE TABLE IF NOT EXISTS work_report_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES work_reports(id),
    item_type VARCHAR(50),
    item_content TEXT NOT NULL,
    hours DECIMAL(5,2) DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_reports_employee ON work_reports(employee_id, report_date);
CREATE INDEX idx_work_reports_status ON work_reports(status);
CREATE INDEX idx_work_report_items_report ON work_report_items(report_id);

-- 添加测试数据（冯稚钧的日报）
INSERT INTO work_reports (employee_id, report_date, report_type, content, status)
VALUES 
('6d9bb7fb-5af8-43e9-afff-54fed00d11f2', '2026-03-02', 'daily', 
 '1. 完成考勤系统功能测试\n2. 修复飞书集成问题\n3. 与产品经理沟通需求\n4. 编写技术文档', 'draft'),
('6d9bb7fb-5af8-43e9-afff-54fed00d11f2', '2026-03-01', 'daily', 
 '1. 开发考勤打卡API\n2. 完成请假模块设计\n3. 数据库表结构设计', 'draft');

SELECT '工作报表表创建完成' AS status;
