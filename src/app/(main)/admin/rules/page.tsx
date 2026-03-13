"use client";

import { useState, useEffect } from "react";

interface Rule {
  id: string;
  rule_name: string;
  work_start_time: string;
  work_end_time: string;
  flexible_minutes: number;
  late_threshold_minutes: number;
  early_leave_threshold_minutes: number;
  is_active: boolean;
  department?: { name: string };
}

export default function RulesManagement() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formData, setFormData] = useState({
    rule_name: "",
    work_start_time: "09:00:00",
    work_end_time: "18:00:00",
    flexible_minutes: 15,
    late_threshold_minutes: 30,
    early_leave_threshold_minutes: 30
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/admin/rules");
      const data = await res.json();
      if (data.success) setRules(data.data);
    } catch (error) {
      console.error("获取规则失败:", error);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingRule(null);
    setFormData({
      rule_name: "",
      work_start_time: "09:00:00",
      work_end_time: "18:00:00",
      flexible_minutes: 15,
      late_threshold_minutes: 30,
      early_leave_threshold_minutes: 30
    });
    setShowModal(true);
  };

  const openEditModal = (rule: Rule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      work_start_time: rule.work_start_time,
      work_end_time: rule.work_end_time,
      flexible_minutes: rule.flexible_minutes,
      late_threshold_minutes: rule.late_threshold_minutes,
      early_leave_threshold_minutes: rule.early_leave_threshold_minutes
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let res;
    if (editingRule) {
      // 编辑模式
      res = await fetch("/api/admin/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: editingRule.id,
          rule_name: formData.rule_name,
          work_start_time: formData.work_start_time,
          work_end_time: formData.work_end_time,
          flexible_minutes: formData.flexible_minutes,
          late_threshold_minutes: formData.late_threshold_minutes,
          early_leave_threshold_minutes: formData.early_leave_threshold_minutes,
          is_active: editingRule.is_active
        })
      });
    } else {
      // 添加模式
      res = await fetch("/api/admin/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
    }
    
    const data = await res.json();
    if (data.success) {
      alert(editingRule ? "修改成功" : "添加成功");
      setShowModal(false);
      setEditingRule(null);
      fetchRules();
    } else {
      alert(data.message);
    }
  };

  const toggleActive = async (rule: Rule) => {
    const res = await fetch("/api/admin/rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rule, is_active: !rule.is_active })
    });
    const data = await res.json();
    if (data.success) fetchRules();
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    return time.substring(0, 5); // HH:mm 格式
  };

  if (loading) return <div className="text-center py-8">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">考勤规则</h1>
          <p className="text-gray-600 mt-1">配置考勤规则和时段</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          + 添加规则
        </button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">
                    {rule.rule_name}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {rule.department?.name || "全局规则"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">上班时间</span>
                    <p className="font-medium">{formatTime(rule.work_start_time)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">下班时间</span>
                    <p className="font-medium">{formatTime(rule.work_end_time)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">弹性时间</span>
                    <p className="font-medium">{rule.flexible_minutes}分钟</p>
                  </div>
                  <div>
                    <span className="text-gray-500">迟到阈值</span>
                    <p className="font-medium">{rule.late_threshold_minutes}分钟</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => openEditModal(rule)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                >
                  编辑
                </button>
                <button
                  onClick={() => toggleActive(rule)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    rule.is_active 
                      ? "bg-green-100 text-green-800 hover:bg-green-200" 
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {rule.is_active ? "启用" : "禁用"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingRule ? "编辑考勤规则" : "添加考勤规则"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">规则名称 *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.rule_name}
                  onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                  placeholder="如：技术部规则"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">上班时间 *</label>
                  <input
                    type="time"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={formatTime(formData.work_start_time)}
                    onChange={(e) => setFormData({ ...formData, work_start_time: e.target.value + ":00" })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">下班时间 *</label>
                  <input
                    type="time"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={formatTime(formData.work_end_time)}
                    onChange={(e) => setFormData({ ...formData, work_end_time: e.target.value + ":00" })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">弹性(分钟)</label>
                  <input
                    type="number"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={formData.flexible_minutes}
                    onChange={(e) => setFormData({ ...formData, flexible_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">迟到阈值</label>
                  <input
                    type="number"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={formData.late_threshold_minutes}
                    onChange={(e) => setFormData({ ...formData, late_threshold_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">早退阈值</label>
                  <input
                    type="number"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={formData.early_leave_threshold_minutes}
                    onChange={(e) => setFormData({ ...formData, early_leave_threshold_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingRule(null); }}
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
