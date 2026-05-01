import { SimpleEntityFormPage } from "@/components/crud/simple-entity-form-page";

export default function NewCategoryPage() {
  return (
    <SimpleEntityFormPage
      table="categories"
      title="Crear Categoría"
      backHref="/categories"
    />
  );
}
