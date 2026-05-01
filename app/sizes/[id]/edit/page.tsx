"use client";

import { useParams } from "next/navigation";

import { SimpleEntityFormPage } from "@/components/crud/simple-entity-form-page";

export default function EditSizePage() {
  const params = useParams<{ id: string }>();

  return (
    <SimpleEntityFormPage
      table="sizes"
      title="Editar Talla"
      backHref="/sizes"
      entityId={params.id}
    />
  );
}
