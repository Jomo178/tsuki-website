"use server";

import { revalidateTag } from "next/cache";
import { addFormSchema, AddFormSchemaType } from "@/container/add/add";
import { UTFile } from "uploadthing/server";

import { prisma } from "@/lib/database";

import { utapi } from "./uploadthing";

export async function addIssues(
  formData: AddFormSchemaType
): Promise<{ message: string; variant: "success" | "error" }> {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const validatedFields = addFormSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { message: "Not valid Data.", variant: "error" };
  }

  const uploadImage = await utapi.uploadFiles(
        new UTFile(
          [formData.image],
          `${formData.name.replace(
            / /g,
            "-"
          )}_${formData.group.replace(/ /g, "-")}_${
            formData.rarity
          }.png`,
          {
            type: formData.image.type,
            customId: `edited_${formData.era.replace(
              / /g,
              "-"
            )}_${botId}_${nanoid(10)}`,
          }
        )
      );

  if (uploadImage.error?.code || !uploadImage.data) {
    return { message: "Image upload failed.", variant: "error" };
  }

  const createPendingIssue = await prisma.pendingIssues.create({
    data: {
      name: formData.name,
      era: formData.era,
      group: formData.group,
      code: formData.code,
      rarity: formData.rarity,
      image: uploadImage.data.url,
      createdById: formData.createdById,
      eventId: formData.eventId,
      dropAble: formData.dropAble,
    },
  });

  revalidateTag("current-event");

  return { message: "successfully added!", variant: "success" };
}
