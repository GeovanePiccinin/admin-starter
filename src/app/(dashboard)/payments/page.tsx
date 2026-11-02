import { PaymentContainer } from "@/features/payment/payment-container";

interface PaymentsPageProps {
  searchParams: Promise<{ attendanceId?: string }>;
}

export default async function PaymentsPage({
  searchParams,
}: PaymentsPageProps) {
  const { attendanceId } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pagamentos</h1>
      </div>

      <PaymentContainer
        key={attendanceId ?? "payments"}
        initialAttendanceId={attendanceId}
      />
    </div>
  );
}
