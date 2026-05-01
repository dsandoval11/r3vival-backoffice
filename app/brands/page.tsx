import { SimpleEntityListPage } from "@/components/crud/simple-entity-list-page";

export default function BrandsPage() {
  return (
    <SimpleEntityListPage
      table="brands"
      title="Marcas"
      createHref="/brands/new"
      editBaseHref="/brands"
    />
  );
}
