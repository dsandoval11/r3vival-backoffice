"use client";

import { useParams } from "next/navigation";

import { ProductForm } from "@/components/products/product-form";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();

  return <ProductForm productId={params.id} />;
}
