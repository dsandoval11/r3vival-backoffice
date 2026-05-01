import { SimpleEntityFormPage } from "@/components/crud/simple-entity-form-page";

export default function NewColorPage() {
  return (
    <SimpleEntityFormPage table="colors" title="Crear Color" backHref="/colors" />
  );
}
