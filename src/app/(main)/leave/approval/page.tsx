import LeaveApproval from "@/components/LeaveApproval";

export default function LeaveApprovalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">请假审批</h1>
        <p className="text-gray-600 mt-1">审批员工的请假申请</p>
      </div>

      <LeaveApproval />
    </div>
  );
}
