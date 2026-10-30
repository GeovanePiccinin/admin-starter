import { AppointmentContainer } from "@/features/appointment/appointment-container";

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agendamentos</h1>
      </div>

      <AppointmentContainer />
    </div>
  );
}
