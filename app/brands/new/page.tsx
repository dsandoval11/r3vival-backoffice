import { SimpleEntityFormPage } from "@/components/crud/simple-entity-form-page";

export default function NewBrandPage() {
  return (
    <SimpleEntityFormPage table="brands" title="Crear Marca" backHref="/brands" />
  );
}
