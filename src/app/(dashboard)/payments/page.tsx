import { PaymentContainer } from "@/features/payment/payment-container";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pagamentos</h1>
      </div>

      <PaymentContainer />
    </div>
  );
}
