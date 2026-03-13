"use client";

import { useState, useEffect } from "react";

interface Employee {
  id: string;
  employee_no: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  is_active: boolean;
  department?: { name: string };
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    employee_no: "",
    name: "",
    position: "",
    phone: "",
    email: ""
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/admin/employees");
      const data = await res.json();
      if (data.success) setEmployees(data.data);
    } catch (error) {
      console.error("获取员工失败:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingEmployee ? "/api/admin/employees" : "/api/admin/employees";
    const method = editingEmployee ? "PUT" : "POST";
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingEmployee ? { ...formData, id: editingEmployee.id } : formData)
    });
    
    const data = await res.json();
    if (data.success) {
      alert(editingEmployee ? "修改成功" : "添加成功");
      setShowModal(false);
      setEditingEmployee(null);
      setFormData({ employee_no: "", name: "", position: "", phone: "", email: "" });
      fetchEmployees();
    } else {
      alert(data.message);
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      employee_no: emp.employee_no,
      name: emp.name,
      position: emp.position || "",
      phone: emp.phone || "",
      email: emp.email || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该员工吗？")) return;
    
    const res = await fetch(`/api/admin/employees?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      alert("删除成功");
      fetchEmployees();
    }
  };

  if (loading) return <div className="text-center py-8">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">员工管理</h1>
          <p className="text-gray-600 mt-1">管理员工信息</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingEmployee(null); setFormData({ employee_no: "", name: "", position: "", phone: "", email: "" }); }}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          + 添加员工
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">工号</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">姓名</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">职位</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">电话</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{emp.employee_no}</td>
                <td className="px-6 py-4 text-sm font-medium">{emp.name}</td>
                <td className="px-6 py-4 text-sm">{emp.position || "-"}</td>
                <td className="px-6 py-4 text-sm">{emp.phone || "-"}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${emp.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {emp.is_active ? "在职" : "离职"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button onClick={() => handleEdit(emp)} className="text-blue-600 hover:underline">编辑</button>
                  <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:underline">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{editingEmployee ? "编辑员工" : "添加员工"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">工号 *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.employee_no}
                  onChange={(e) => setFormData({ ...formData, employee_no: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">姓名 *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">职位</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">电话</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">邮箱</label>
                <input
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  取消
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
