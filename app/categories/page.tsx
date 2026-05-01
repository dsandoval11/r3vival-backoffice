import { SimpleEntityListPage } from "@/components/crud/simple-entity-list-page";

export default function CategoriesPage() {
  return (
    <SimpleEntityListPage
      table="categories"
      title="Categorías"
      createHref="/categories/new"
      editBaseHref="/categories"
    />
  );
}
