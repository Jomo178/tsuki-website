"use client";

import { DiscordProfile } from "next-auth/providers/discord";

import { ItemsNameType, ItemType } from "@/types/view";
import { cn, formatTimestamp, toUpperCase } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ItemsHistoryProps<T extends ItemsNameType> {
  itemNameType: T;
  item: ItemType<T>[1] | ItemType<T>[0];
  AllStaffInformation: Partial<DiscordProfile[]>;
}

export default function ItemsHistory<T extends ItemsNameType>({
  itemNameType,
  item,
  AllStaffInformation,
}: ItemsHistoryProps<T>) {
  const getDataByDiscordId = (id: string) => {
    const defaultData = { username: "IU", avatar: "/images/tsuki.png" };
    if (!AllStaffInformation) return defaultData;
    const info = AllStaffInformation.find((staff) => staff?.discordId === id);
    if (!info) return defaultData;
    return { username: info.global_name, avatar: info.image };
  };

  const historyProcess = [
    {
      title: "Created",
      timestamp: item.createdAt,
      userInfo: getDataByDiscordId(item.createdBy?.discordId ?? "IU"),
      style: "",
    },
  ];

  if (item.rejections?.length > 0) {
    item.rejections.forEach((rejection) => {
      historyProcess.push({
        title: "Rejected",
        timestamp: rejection.createdAt,
        userInfo: getDataByDiscordId(rejection.rejectedBy.discordId ?? "IU"),
        style: "text-red-500",
      });

      if (!rejection.resubmitted) {
        historyProcess.push({
          title: "Waiting for resubmission",
          timestamp: rejection.createdAt,
          userInfo: getDataByDiscordId("IU"),
          style: "text-red-500",
        });
      } else {
        historyProcess.push({
          title: "Resubmitted",
          timestamp: rejection.resubmittedAt ?? new Date(),
          userInfo: getDataByDiscordId(
            rejection.resubmittedBy?.discordId ?? "IU"
          ),
          style: "text-green-500",
        });
      }
    });
  }

  if (
    !item.approvedBy &&
    !historyProcess.some((event) => event.title === "Waiting for resubmission")
  ) {
    historyProcess.push({
      title: "Waiting for approval",
      timestamp: item.createdAt,
      userInfo: getDataByDiscordId("IU"),
      style: "text-green-500",
    });
  }

  if (item.approvedBy) {
    historyProcess.push({
      title: "Approved",
      timestamp: item.approvedAt ?? new Date(),
      userInfo: getDataByDiscordId(item.approvedBy.discordId),
      style: "text-green-500",
    });
  }

  return (
    <Card className="h-[400px] w-full rounded-t-none border-0 border-t-2">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {toUpperCase(itemNameType.slice(0, -1))} History
          </h2>
        </div>
        <div className="flex min-h-full pt-4">
          <Separator orientation="vertical" />
          <div className="flex-1">
            {historyProcess.map((event, index) => (
              <div
                key={index}
                className="mb-4 flex w-full items-center justify-evenly"
              >
                <div className="flex w-full items-center gap-2">
                  <Separator className="max-w-6" />
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={event?.userInfo?.avatar ?? "/images/iu.png"}
                      alt={event?.userInfo?.username}
                    />
                    <AvatarFallback>
                      {event?.userInfo?.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="min-w-fit text-sm font-medium">
                    {event.userInfo?.username}
                  </p>
                  <div className="flex w-full items-center space-x-1 text-center">
                    <p
                      className={cn(
                        "min-w-fit font-mono text-sm font-medium",
                        event.style
                      )}
                    >
                      {event.title}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {formatTimestamp(event.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
