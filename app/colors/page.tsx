import { SimpleEntityListPage } from "@/components/crud/simple-entity-list-page";

export default function ColorsPage() {
  return (
    <SimpleEntityListPage
      table="colors"
      title="Colores"
      createHref="/colors/new"
      editBaseHref="/colors"
    />
  );
}
