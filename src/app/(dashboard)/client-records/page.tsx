import { ClientRecordContainer } from "@/features/client-record/client-record-container";

export default function ClientRecordsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Fichas de clientes
        </h1>
      </div>

      <ClientRecordContainer />
    </div>
  );
}
