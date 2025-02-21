import { notFound } from "next/navigation";
import { generateItemsViewPort } from "@/container/view/view";
import ViewAllItems from "@/container/view/view-all-items";
import ViewItemsGroupPreview from "@/container/view/view-items-group-preview";
import { getCurrentEvent } from "@/server/events-action";
import { ItemsType } from "@prisma/client";

import { ItemsNameType, ItemStatusViewType } from "@/types/view";
import { getCurrentUser } from "@/lib/session";

export async function generateStaticParams() {
  const itemsTypeArray = Object.values(ItemsType).map((type) => {
    let arrayType: { id: string }[] = [{ id: type }];
    const createViewPortType = generateItemsViewPort(type);
    createViewPortType.forEach((viewPortType) => {
      arrayType.push({ id: viewPortType.id });
    });
    return arrayType;
  });

  return itemsTypeArray.flat().map((item) => ({
    type: item.id,
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ type: string; test: string }>;
}) {
  const type = (await params).type;
  const getCurrentStaff = await getCurrentUser(true);
  if (!getCurrentStaff?.staff || !getCurrentStaff.staff.isInTeam)
    return notFound();
  const event = await getCurrentEvent(["issues"]);
  if (!event) return notFound();

  const itemNameType = type?.split("-")[1] as ItemsNameType;

  return (
    <div className="container mx-auto px-4 sm:px-6">
      {Object.values(ItemsType).includes(type as ItemsNameType) ? (
        <ViewItemsGroupPreview
          itemNameType={type as ItemsNameType}
          currentUser={getCurrentStaff.staff}
          event={event}
        />
      ) : (
        <ViewAllItems
          itemNameType={itemNameType}
          itemsViewPortId={type as ItemStatusViewType<typeof itemNameType>}
          currentUser={getCurrentStaff.staff}
          event={event}
        />
      )}
    </div>
  );
}
