import { SimpleEntityListPage } from "@/components/crud/simple-entity-list-page";

export default function ConditionsPage() {
  return (
    <SimpleEntityListPage
      table="conditions"
      title="Condiciones"
      createHref="/conditions/new"
      editBaseHref="/conditions"
    />
  );
}
