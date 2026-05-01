"use client";

import { useParams } from "next/navigation";

import { SimpleEntityFormPage } from "@/components/crud/simple-entity-form-page";

export default function EditColorPage() {
  const params = useParams<{ id: string }>();

  return (
    <SimpleEntityFormPage
      table="colors"
      title="Editar Color"
      backHref="/colors"
      entityId={params.id}
    />
  );
}
