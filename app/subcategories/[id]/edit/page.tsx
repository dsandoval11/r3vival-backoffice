"use client";

import { useParams } from "next/navigation";

import { SubcategoryFormPage } from "@/components/crud/subcategory-form-page";

export default function EditSubcategoryPage() {
  const params = useParams<{ id: string }>();

  return <SubcategoryFormPage subcategoryId={params.id} />;
}
