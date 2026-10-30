import { ProfessionalContainer } from "@/features/professional/professional-container";

export default function ProfessionalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profissionais</h1>
      </div>

      <ProfessionalContainer />
    </div>
  );
}
