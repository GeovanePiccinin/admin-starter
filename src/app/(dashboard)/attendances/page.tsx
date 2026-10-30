import { AttendanceContainer } from "@/features/attendance/attendance-container";

export default function AttendancesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Atendimentos</h1>
      </div>

      <AttendanceContainer />
    </div>
  );
}
