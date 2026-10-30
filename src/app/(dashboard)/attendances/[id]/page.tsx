import { AttendanceWorkspace } from "@/features/attendance/attendance-workspace";

interface AttendancePageProps {
  params: Promise<{ id: string }>;
}

export default async function AttendancePage({ params }: AttendancePageProps) {
  const { id } = await params;

  return <AttendanceWorkspace attendanceId={id} />;
}
