import { ClientContainer } from "@/features/client/client-container";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
      </div>

      <ClientContainer />
    </div>
  );
}
