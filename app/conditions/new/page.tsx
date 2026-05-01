import { SimpleEntityFormPage } from "@/components/crud/simple-entity-form-page";

export default function NewConditionPage() {
  return (
    <SimpleEntityFormPage
      table="conditions"
      title="Crear Condición"
      backHref="/conditions"
    />
  );
}
