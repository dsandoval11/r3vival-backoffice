import { SimpleEntityListPage } from "@/components/crud/simple-entity-list-page";

export default function SizesPage() {
  return (
    <SimpleEntityListPage
      table="sizes"
      title="Tallas"
      createHref="/sizes/new"
      editBaseHref="/sizes"
    />
  );
}
