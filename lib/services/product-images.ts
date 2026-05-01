import { PRODUCT_IMAGES_BUCKET } from "@/lib/config";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Id, ProductImage } from "@/lib/types";
import {
  getStoragePathFromPublicUrl,
  sanitizeFileName,
} from "@/lib/utils/storage";
import { requireId } from "@/lib/utils/validation";

export async function fetchProductImages(productId: Id) {
  requireId(productId, "Product");

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("product_images")
    .select("id,product_id,image_url,is_cover")
    .eq("product_id", productId)
    .order("is_cover", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as ProductImage[];
}

export async function uploadProductImages(productId: Id, files: File[]) {
  requireId(productId, "Product");

  if (files.length === 0) {
    return [];
  }

  const supabase = getSupabaseClient();
  const currentImages = await fetchProductImages(productId);
  const hasCoverImage = currentImages.some((image) => image.is_cover);
  const uploadedRows: ProductImage[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const filePath = `${productId}/${Date.now()}-${index}-${sanitizeFileName(
      file.name,
    )}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(filePath, file, {
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);

    const shouldBeCover = !hasCoverImage && index === 0;

    const { data, error } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        image_url: publicUrl,
        is_cover: shouldBeCover,
      })
      .select("id,product_id,image_url,is_cover")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    uploadedRows.push(data as ProductImage);
  }

  return uploadedRows;
}

export async function setProductCoverImage(productId: Id, imageId: Id) {
  requireId(productId, "Product");
  requireId(imageId, "Image");

  const supabase = getSupabaseClient();

  const { error: resetCoverError } = await supabase
    .from("product_images")
    .update({ is_cover: false })
    .eq("product_id", productId);

  if (resetCoverError) {
    throw new Error(resetCoverError.message);
  }

  const { error: setCoverError } = await supabase
    .from("product_images")
    .update({ is_cover: true })
    .eq("id", imageId)
    .eq("product_id", productId);

  if (setCoverError) {
    throw new Error(setCoverError.message);
  }
}

export async function deleteProductImage(image: ProductImage) {
  const supabase = getSupabaseClient();
  const imagePath = getStoragePathFromPublicUrl(
    image.image_url,
    PRODUCT_IMAGES_BUCKET,
  );

  if (imagePath) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([imagePath]);

    if (storageError) {
      throw new Error(storageError.message);
    }
  }

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", image.id)
    .eq("product_id", image.product_id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (image.is_cover) {
    const remainingImages = await fetchProductImages(image.product_id);

    if (remainingImages.length > 0) {
      await setProductCoverImage(image.product_id, remainingImages[0].id);
    }
  }
}

export async function deleteAllProductImages(productId: Id) {
  requireId(productId, "Product");

  const supabase = getSupabaseClient();
  const images = await fetchProductImages(productId);
  const removablePaths = images
    .map((image) =>
      getStoragePathFromPublicUrl(image.image_url, PRODUCT_IMAGES_BUCKET),
    )
    .filter((path): path is string => Boolean(path));

  if (removablePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(removablePaths);

    if (storageError) {
      throw new Error(storageError.message);
    }
  }

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}
