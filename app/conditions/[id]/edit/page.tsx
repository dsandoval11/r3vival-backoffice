"use client";

import { useParams } from "next/navigation";

import { SimpleEntityFormPage } from "@/components/crud/simple-entity-form-page";

export default function EditConditionPage() {
  const params = useParams<{ id: string }>();

  return (
    <SimpleEntityFormPage
      table="conditions"
      title="Editar Condición"
      backHref="/conditions"
      entityId={params.id}
    />
  );
}
