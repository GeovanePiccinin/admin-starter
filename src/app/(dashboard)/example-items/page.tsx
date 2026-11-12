import { ExampleItemContainer } from "@/features/example-item/example-item-container";

export default function ExampleItemsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Itens de exemplo
        </h1>
      </div>

      <ExampleItemContainer />
    </div>
  );
}
