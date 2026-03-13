import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">系统管理</h1>
        <p className="text-gray-600 mt-1">系统配置和管理</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/admin/employees" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">员工管理</h3>
            <p className="text-gray-600">添加、编辑、删除员工信息</p>
          </div>
        </Link>
        
        <Link href="/admin/rules" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-xl font-semibold mb-2">考勤规则</h3>
            <p className="text-gray-600">配置考勤规则和时段</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
