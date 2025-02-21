"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Events, ItemsType, Staff } from "@prisma/client";
import Balancer from "react-wrap-balancer";

import { ItemListingView, ItemsNameType } from "@/types/view";
import { cn, toUpperCase } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useMultiSidebar } from "@/components/ui/multisidebar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ItemsInformationSidebar from "./items-information-sidebar";
import { generateItemsViewPort } from "./view";
import ViewItemCard from "./view-item-card";
import { SkeletonViewGroup, ViewItemSkeleton } from "./view-item-skeleton";

interface ViewItemsGroupPreviewProps<T extends ItemsNameType> {
  itemNameType: T;
  currentUser: Staff;
  event: Events;
}

export default function ViewItemsGroupPreview<T extends ItemsNameType>({
  itemNameType,
  currentUser,
  event,
}: ViewItemsGroupPreviewProps<T>) {
  const { open } = useMultiSidebar().rightSidebar;
  const [loading, setLoading] = useState(false);
  const [openSidebarInformation, setOpenSidebarInformation] = useState(false);
  const [itemsGroup, setItemsGroup] = useState<ItemListingView<T>[]>(
    generateItemsViewPort(itemNameType)
  );

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const updatedGroupData = await Promise.all(
        itemsGroup.map(async (viewPort) => {
          const data = await viewPort.fetchFunction(
            viewPort.fetchCount,
            10,
            {},
            {}
          );

          return {
            ...viewPort,
            data: data.map((item) => ({
              ...item,
              approvedBy: item.approvedBy,
            })),
            fetchCount: viewPort.fetchCount + data.length,
          };
        })
      );
      setItemsGroup(updatedGroupData);
      setLoading(false);
    };

    fetchItems();
  }, []);

  return (
    <div className={cn(open ? "container" : "container md:pr-0")}>
      <Tabs defaultValue={itemNameType} className="mt-5 space-y-6">
        <div className="space-between flex items-center">
          <div className="space-between flex flex-col items-center gap-4 sm:flex-row">
            <TabsList className="w-full">
              {Object.values(ItemsType).map((item) => (
                <Link
                  href={`/dashboard/view/${item}`}
                  prefetch={true}
                  key={item}
                >
                  <TabsTrigger value={item} className="w-full">
                    {toUpperCase(item)}
                  </TabsTrigger>
                </Link>
              ))}
              <TabsTrigger value="" disabled>
                Events
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        <Separator className="my-4" />
        <TabsContent
          value={itemNameType}
          className="border-none p-0 outline-none"
        >
          {loading &&
            itemsGroup.map((itemViewPort) => (
              <SkeletonViewGroup key={itemViewPort.title} />
            ))}
          {itemsGroup.every((itemViewPort) => itemViewPort.data.length === 0) &&
          !loading ? (
            <EmptyState
              title={`No ${toUpperCase(itemNameType)} found`}
              description={"Get started by creating a new " + itemNameType}
              action={
                <Link
                  href={`/dashboard/add/${itemNameType}`}
                  className={buttonVariants({ variant: "outline" })}
                  prefetch={true}
                >
                  Create {toUpperCase(itemNameType)}
                </Link>
              }
            />
          ) : (
            itemsGroup.map((itemViewPort) => {
              if (itemViewPort.data.length === 0) return null;
              return (
                <div key={itemViewPort.title}>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        {itemViewPort.title}
                      </h2>
                      <Balancer className="text-sm text-muted-foreground">
                        {itemViewPort.description}
                      </Balancer>
                      {itemViewPort.noteDescription && (
                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                          {itemViewPort.noteDescription}
                        </code>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Link
                        className={buttonVariants({ variant: "outline" })}
                        href={itemViewPort.href}
                        prefetch={true}
                      >
                        View all
                      </Link>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div>
                    <ScrollArea
                      className={cn(
                        "w-[calc(100vw-135px)]",
                        open ? "md:w-[calc(100vw-391px)]" : ""
                      )}
                    >
                      <div className="flex space-x-4 pb-4">
                        {itemViewPort.data.length === 0 &&
                          Array.from({ length: 8 }).map((_, index) => (
                            <ViewItemSkeleton key={index} />
                          ))}
                        {itemViewPort.data.map((item) => {
                          return (
                            <ViewItemCard
                              key={item.id}
                              currentUser={currentUser}
                              event={event}
                              item={item}
                              itemNameType={itemNameType}
                              isItemSelected={itemViewPort.selectedItems
                                .map((item) => item.id)
                                .includes(item.id)}
                              viewPortType={itemViewPort as any}
                              setInformationSidebarAction={(open) => {
                                setItemsGroup((prev) => {
                                  return prev.map((viewPort) => {
                                    if (viewPort.title === itemViewPort.title) {
                                      return {
                                        ...viewPort,
                                        selectedItems:
                                          viewPort.selectedItems.find(
                                            (value) => value.id == item.id
                                          )
                                            ? []
                                            : [item],
                                      };
                                    } else {
                                      viewPort.selectedItems = [];
                                    }
                                    setOpenSidebarInformation(open);
                                    return viewPort;
                                  });
                                });
                              }}
                            />
                          );
                        })}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
      <ItemsInformationSidebar
        itemNameType={itemNameType}
        items={itemsGroup.map((item) => item.selectedItems).flat()}
        itemsViewPortId={
          itemsGroup.find((value) => value.selectedItems.length > 0)?.id!
        }
        openSidebar={openSidebarInformation}
        setOpenSidebarAction={setOpenSidebarInformation}
      />
    </div>
  );
}
