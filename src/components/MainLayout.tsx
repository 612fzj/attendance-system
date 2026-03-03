"use client";

import Link from "next/link";
import { ReactNode, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ChangePasswordModal from "./ChangePasswordModal";

interface Employee {
  id: number;
  employee_no: string;
  name: string;
  department: string;
  position: string;
}

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 从 localStorage 获取登录用户信息
    const stored = localStorage.getItem("employee");
    if (stored) {
      try {
        setEmployee(JSON.parse(stored));
      } catch {
        setEmployee(null);
      }
    }
  }, []);

  useEffect(() => {
    // 点击外部关闭下拉菜单
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("employee");
    localStorage.removeItem("token");
    setEmployee(null);
    setShowDropdown(false);
    router.push("/login");
  };

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                考勤系统
              </Link>
              <div className="ml-10 flex space-x-6">
                <Link href="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600">
                  首页
                </Link>
                <Link href="/attendance" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-blue-600">
                  考勤打卡
                </Link>
                <Link href="/attendance/detail" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-blue-600">
                  考勤查询
                </Link>
                <Link href="/daily-report" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-blue-600">
                  工作日报
                </Link>
                <Link href="/leave" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-blue-600">
                  请假管理
                </Link>
                <Link href="/leave/approval" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-blue-600">
                  请假审批
                </Link>
                <Link href="/reports" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-blue-600">
                  报表统计
                </Link>
                <Link href="/admin" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-blue-600">
                  系统管理
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              {employee ? (
                // 已登录：显示用户名和下拉菜单
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 text-sm text-gray-700 hover:text-blue-600 focus:outline-none"
                  >
                    <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {employee.name.charAt(0)}
                    </span>
                    <span className="font-medium">{employee.name}</span>
                    <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                        <p className="text-xs text-gray-500">{employee.department} · {employee.position}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setShowPasswordModal(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        修改密码
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // 未登录：显示登录按钮
                <Link href="/login" className="text-sm text-blue-500 hover:text-blue-700 font-medium">
                  登录
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
        © 2026 考勤管理系统 | Powered by Next.js + Supabase
      </footer>

      {/* 修改密码弹窗 */}
      {showPasswordModal && employee && (
        <ChangePasswordModal
          employeeNo={employee.employee_no}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </>
  );
}
