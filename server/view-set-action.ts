"use server";

import { revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";

import {
  EditItemsProps,
  ItemsNameType,
  ItemsPendingType,
  ItemStatusViewType,
  ItemType,
} from "@/types/view";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/session";
import { toUpperCase } from "@/lib/utils";

import { utapi } from "./uploadthing";

export async function approveItems(
  itemIds: string[],
  tableName: ItemsPendingType
) {
  const currentUser = await getCurrentUser(true);

  try {
    await prisma.$transaction([
      (prisma[tableName] as any).updateMany({
        where: {
          id: {
            in: itemIds,
          },
        },
        data: {
          approvedAt: new Date(),
          approvedById: currentUser.staff.id,
        },
      }),
    ]);

    revalidateTag("all-events");
    revalidateTag("current-event");

    return {
      message: `Items approved successfully.`,
    };
  } catch (error) {
    console.error(`Error approving items in table ${tableName}:`, error);
    return {
      message: `Failed to approve some or all Items.`,
    };
  }
}

export async function rejectItems(
  itemIds: string[],
  tableName: ItemsPendingType,
  reason: string
) {
  const currentUser = await getCurrentUser(true);

  await prisma.rejections.createMany({
    data: itemIds.map((id) => ({
      reason,
      [`${tableName}Id`]: id,
      rejectedById: currentUser.staff!.id,
    })),
  });

  revalidateTag("all-events");
  revalidateTag("current-event");

  return {
    message: `Items rejected successfully.`,
  };
}

export async function resubmitRejectedItems(
  itemIds: string[],
  tableName: "pendingFrames" | "pendingIssues" | "pendingFonts"
) {
  const currentUser = await getCurrentUser(true);

  try {
    await prisma.$transaction([
      prisma.rejections.updateMany({
        where: {
          [`${tableName}Id`]: {
            in: itemIds,
          },
        },
        data: {
          resubmitted: true,
          resubmittedById: currentUser.staff.id,
        },
      }),
    ]);

    revalidateTag("all-events");
    revalidateTag("current-event");

    return {
      message: `Items resubmitted successfully.`,
    };
  } catch (error) {
    console.error(`Error resubmitting items in table ${tableName}:`, error);
    return {
      message: `Failed to resubmit some or all Items.`,
    };
  }
}

export async function deleteItems<T extends ItemsNameType>(
  itemsViewPortId: ItemStatusViewType<T>,
  items: { id: string; image: string }[],
  password: string
) {
  if (items.length == 0) return { message: "No item selected." };
  const currentUser = await getCurrentUser(true);

  if (password !== "tsuki-delete-items") {
    throw new Error("Items were not deleted. Incorrect password.");
  }

  const test = await utapi.deleteFiles(
    items
      .map((item) => item.image.split("/").pop())
      .filter((image): image is string => !!image)
  );

  const itemsIds = {
    id: {
      in: items.map((item) => item.id),
    },
  };

  if (itemsViewPortId.includes("released")) {
    if (itemsViewPortId === "released-issues") {
      await prisma.issues.deleteMany({
        where: itemsIds,
      });
    }
  } else {
    if (
      itemsViewPortId === "pending-issues" ||
      itemsViewPortId === "rejected-issues" ||
      itemsViewPortId === "upcoming-issues"
    ) {
      await prisma.pendingIssues.deleteMany({
        where: itemsIds,
      });
    }
  }

  revalidateTag("all-events");
  revalidateTag("current-event");

  return {
    message: "Items deleted successfully.",
  };
}

export async function editItems<T extends ItemsNameType>({
  itemsViewPortId,
  item,
}: EditItemsProps<T>) {
  const currentUser = await getCurrentUser(true);
  const items = itemsViewPortId.split("-")[1] as T;

  if (item.changedImage) {
    // const deleteImage = await utapi.deleteFiles(item.imageLink.split("/"));

    // if (!deleteImage.success) return { message: "Item was not Edited" };

    const response = await utapi.uploadFiles(item.image);

    if (response.error?.code || !response.data) {
      throw new Error(
        "Issue was not Edited. An error occurred while uploading the image."
      );
    }

    item.imageLink = response.data.url;
  }

  let edited;
  let data = {};
  const include = {
    event: true,
    createdBy: true,
    approvedBy: true,
    rejections: {
      include: {
        rejectedBy: true,
        resubmittedBy: true,
      },
    },
  };

  if (items == "issues") {
    const issueData: Prisma.IssuesUpdateInput = {
      name: item.name,
      group: item.group,
      era: item.era,
      rarity: item.rarity,
      code: item.code,
      image: item.imageLink,
    };
    data = issueData;
  }

  if (itemsViewPortId.includes("released")) {
    edited = await (prisma[items] as any).update({
      where: {
        id: item.id,
      },
      data,
      include,
    });
  } else {
    const pendingItems = `pending${toUpperCase(items)}` as ItemsPendingType;

    edited = await (prisma[pendingItems] as any).update({
      where: {
        id: item.id,
      },
      data,
      include,
    });
  }

  revalidateTag("all-events");
  revalidateTag("current-event");

  return {
    message: `${items} edited successfully.`,
    editedItem: edited as ItemType<T>[0] | ItemType<T>[1],
  };
}
