"use client";

import { useParams } from "next/navigation";

import { SimpleEntityFormPage } from "@/components/crud/simple-entity-form-page";

export default function EditCategoryPage() {
  const params = useParams<{ id: string }>();

  return (
    <SimpleEntityFormPage
      table="categories"
      title="Editar Categoría"
      backHref="/categories"
      entityId={params.id}
    />
  );
}
