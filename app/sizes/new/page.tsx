import { SimpleEntityFormPage } from "@/components/crud/simple-entity-form-page";

export default function NewSizePage() {
  return <SimpleEntityFormPage table="sizes" title="Crear Talla" backHref="/sizes" />;
}
