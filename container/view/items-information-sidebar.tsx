"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Star } from "lucide-react";
import { DiscordProfile } from "next-auth/providers/discord";

import { ItemsNameType, ItemStatusViewType, ItemType } from "@/types/view";
import { cn, formatTimestamp, toUpperCase } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  MultiSidebarProvider,
  Sidebar,
  SidebarContent,
  useMultiSidebar,
} from "@/components/ui/multisidebar";
import { ScrollBar } from "@/components/ui/scroll-area";
import { getStaffAllInformation } from "@/app/(dashboard)/dashboard/action";

import { scrollToCarousel } from "../add/add";
import ItemsHistory from "./items-history";

interface ItemsInformationSidebarProps<T extends ItemsNameType> {
  itemNameType: T;
  items: ItemType<T>[1][] | ItemType<T>[0][];
  itemsViewPortId: ItemStatusViewType<T>;
  openSidebar: boolean;
  setOpenSidebarAction: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ItemsInformationSidebar<T extends ItemsNameType>({
  itemNameType,
  items,
  itemsViewPortId,
  openSidebar,
  setOpenSidebarAction,
}: ItemsInformationSidebarProps<T>) {
  const isSelected = items.length > 0 && openSidebar;
  const { isMobile } = useMultiSidebar().rightSidebar;

  return (
    <>
      <MultiSidebarProvider className={cn("block", !isSelected && "hidden")}>
        <Sidebar
          variant="floating"
          collapsible="icon"
          side="right"
          className="w-[400px] overflow-hidden"
        >
          <SidebarContent className="bg-background">
            <SelectedIssuesCarousel
              itemNameType={itemNameType}
              items={items}
              itemsViewPortId={itemsViewPortId}
            />
          </SidebarContent>
        </Sidebar>
      </MultiSidebarProvider>

      <Drawer
        open={openSidebar && isMobile}
        onOpenChange={(open) => {
          if (isMobile) setOpenSidebarAction(open);
        }}
      >
        <DrawerContent className="h-[30rem]">
          <DrawerHeader>
            <DrawerTitle>Issue Information</DrawerTitle>
            <DrawerClose />
          </DrawerHeader>
          <ScrollArea className="overflow-auto break-all p-4">
            <SelectedIssuesCarousel
              itemNameType={itemNameType}
              items={items}
              itemsViewPortId={itemsViewPortId}
            />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </>
  );
}

interface SelectedIssuesCarouselProps<T extends ItemsNameType> {
  itemNameType: T;
  items: ItemType<T>[1][] | ItemType<T>[0][];
  itemsViewPortId: ItemStatusViewType<T>;
  className?: string;
}

function SelectedIssuesCarousel<T extends ItemsNameType>({
  itemNameType,
  items,
  itemsViewPortId,
  className,
}: SelectedIssuesCarouselProps<T>) {
  const [AllStaffInformation, setAllStaffInformation] = useState<
    Partial<DiscordProfile[]>
  >([]);

  useEffect(() => {
    async function fetchStaffInformation() {
      const data = (await getStaffAllInformation()) as any;
      setAllStaffInformation(data);
    }
    fetchStaffInformation();
  }, []);

  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    scrollToCarousel(api, items.length);
  }, [items]);

  return (
    <Carousel setApi={setApi} className="h-full w-full">
      <CarouselContent className={cn(className)}>
        {items.map((item, index) => (
          <CarouselItem key={index} className="items-center">
            {itemNameType.includes("issues") && (
              <IssueCardDetails
                issue={item as ItemType<"issues">[1]}
                itemsViewPortId={
                  itemsViewPortId as ItemStatusViewType<"issues">
                }
              />
            )}
            <ItemRejections
              item={item}
              AllStaffInformation={AllStaffInformation}
            />
            <ItemsHistory
              itemNameType={itemNameType}
              item={item}
              AllStaffInformation={AllStaffInformation}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}

function IssueCardDetails({
  issue,
  itemsViewPortId,
}: {
  issue: ItemType<"issues">[1];
  itemsViewPortId: ItemStatusViewType<"issues">;
}) {
  return (
    <Card className="!w-full border-0">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between pt-5">
          <h2 className="text-lg font-semibold">
            Current Issue
            <code className="relative ml-1 rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
              {issue.name}
            </code>
          </h2>
          <Badge className="text-white">{toUpperCase(itemsViewPortId)}</Badge>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-2 pb-10">
          <div className="space-x-3">
            <small className="text-sm font-medium leading-none">Group:</small>
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
              {issue.group}
            </code>
          </div>
          <div className="flex items-center space-x-3">
            <small className="text-sm font-medium leading-none">Rarity:</small>
            <code className="relative flex w-fit rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
              {Array.from({ length: issue.rarity }).map((_, starIndex) => (
                <Star key={starIndex} size={16} />
              ))}
            </code>
          </div>
          <div className="space-x-3">
            <small className="text-sm font-medium leading-none">Era:</small>
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
              {issue.era}
            </code>
          </div>
          <div className="space-x-3">
            <small className="text-sm font-medium leading-none">Code:</small>
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
              {issue.code}
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ItemRejectionsProps<T extends ItemsNameType> {
  item: ItemType<T>[1] | ItemType<T>[0];
  AllStaffInformation: Partial<DiscordProfile[]>;
}

function ItemRejections<T extends ItemsNameType>({
  item,
  AllStaffInformation,
}: ItemRejectionsProps<T>) {
  if (!item.rejections.length) return null;

  return (
    <Card className="!w-full rounded-t-none border-0 border-t-2">
      <CardTitle className="p-4 text-lg font-semibold">Rejections</CardTitle>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 pb-10">
          {item.rejections.map((rejection, index) => {
            const staff = AllStaffInformation?.find(
              (staff) => staff?.discordId === rejection.rejectedBy.discordId
            );
            return (
              <div key={index} className="col-span-2 flex flex-col">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={staff?.image ?? "/images/iu.png"}
                      alt={staff?.global_name}
                    />
                    <AvatarFallback>
                      {staff?.global_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                    {rejection.reason}
                  </code>
                </div>
                <span className="pt-2 text-xs">
                  {formatTimestamp(rejection.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
