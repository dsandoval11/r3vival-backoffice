"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";

import {
  deleteProductImage,
  fetchProductImages,
  setProductCoverImage,
  uploadProductImages,
} from "@/lib/services/product-images";
import type { ProductImage } from "@/lib/types";

interface ProductImagesManagerProps {
  productId: string;
}

export function ProductImagesManager({ productId }: ProductImagesManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await fetchProductImages(productId);
      setImages(rows);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load images.",
      );
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await uploadProductImages(productId, Array.from(files));
      await loadImages();
    } catch (uploadError) {
      console.error(uploadError);
      setError(
        uploadError instanceof Error ? uploadError.message : "Failed to upload images.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSetCover(imageId: string) {
    try {
      setError(null);
      await setProductCoverImage(productId, imageId);
      await loadImages();
    } catch (coverError) {
      console.error(coverError);
      setError(
        coverError instanceof Error ? coverError.message : "Failed to update cover image.",
      );
    }
  }

  async function handleDelete(image: ProductImage) {
    const confirmed = window.confirm("Delete this image?");
    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      await deleteProductImage(image);
      await loadImages();
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete image.",
      );
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Imágenes del producto</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Sube varias imágenes, elige una portada y elimina las que no necesites.
      </p>

      <div className="mt-4">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(event) => void handleFileUpload(event.target.files)}
          className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800"
          disabled={uploading}
        />
      </div>

      {uploading ? (
        <p className="mt-3 text-sm text-zinc-500">Subiendo imágenes...</p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-zinc-500">Cargando imágenes...</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-50"
            >
              <img
                src={image.image_url}
                alt="Product"
                className="h-40 w-full object-cover"
              />
              <div className="space-y-2 p-3">
                {image.is_cover ? (
                  <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    Portada
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSetCover(image.id)}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    Usar como portada
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleDelete(image)}
                  className="block rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {images.length === 0 ? (
            <p className="col-span-full text-sm text-zinc-500">
              Este producto aún no tiene imágenes.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
