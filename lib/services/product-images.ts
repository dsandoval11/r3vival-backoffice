import { PRODUCT_IMAGES_BUCKET } from "@/lib/config";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Id, ProductImage } from "@/lib/types";
import { getStoragePathFromPublicUrl } from "@/lib/utils/storage";
import { requireId } from "@/lib/utils/validation";

const CLOUDINARY_UPLOAD_BASE = "https://api.cloudinary.com/v1_1";

async function getCloudinarySignature(folder: string) {
  const res = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });

  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? "Failed to get Cloudinary signature");
  }

  return res.json() as Promise<{
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
  }>;
}

async function deleteCloudinaryAsset(publicId: string) {
  const res = await fetch("/api/cloudinary/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId }),
  });

  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? "Failed to delete Cloudinary asset");
  }
}

export async function fetchProductImages(productId: Id) {
  requireId(productId, "Product");

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("product_images")
    .select("id,product_id,image_url,is_cover,cloudinary_public_id")
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

  const folder = `r3vival/products/${productId}`;
  const { signature, timestamp, apiKey, cloudName } =
    await getCloudinarySignature(folder);

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("folder", folder);

    const uploadRes = await fetch(
      `${CLOUDINARY_UPLOAD_BASE}/${cloudName}/image/upload`,
      { method: "POST", body: formData },
    );

    if (!uploadRes.ok) {
      throw new Error(`Cloudinary upload failed: ${uploadRes.statusText}`);
    }

    const { secure_url, public_id } = (await uploadRes.json()) as {
      secure_url: string;
      public_id: string;
    };

    const shouldBeCover = !hasCoverImage && index === 0;

    const { data, error } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        image_url: secure_url,
        cloudinary_public_id: public_id,
        is_cover: shouldBeCover,
      })
      .select("id,product_id,image_url,is_cover,cloudinary_public_id")
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

  if (image.cloudinary_public_id) {
    await deleteCloudinaryAsset(image.cloudinary_public_id);
  } else {
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

  const cloudinaryIds = images
    .map((img) => img.cloudinary_public_id)
    .filter((id): id is string => Boolean(id));

  await Promise.all(cloudinaryIds.map(deleteCloudinaryAsset));

  const storagePaths = images
    .map((img) =>
      getStoragePathFromPublicUrl(img.image_url, PRODUCT_IMAGES_BUCKET),
    )
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(storagePaths);

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
