"use client";

import { useParams } from "next/navigation";

import { SimpleEntityFormPage } from "@/components/crud/simple-entity-form-page";

export default function EditBrandPage() {
  const params = useParams<{ id: string }>();

  return (
    <SimpleEntityFormPage
      table="brands"
      title="Editar Marca"
      backHref="/brands"
      entityId={params.id}
    />
  );
}
