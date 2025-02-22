"use client";

import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { endEvent, releaseEvent } from "@/server/events-action";
import { ItemsType, Staff } from "@prisma/client";
import { AnimatePresence, motion, useSpring } from "framer-motion";
import {
  CalendarOff,
  CheckCircle2,
  CircleAlert,
  Clock,
  Menu,
  MessageSquare,
  StepForwardIcon as Progress,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { EventsWithRelation } from "@/types/prisma-relations";
import {
  formatDistanceToNow,
  formatTimestamp,
  hasPermission,
  toUpperCase,
} from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { Progress as ProgressBar } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { StaffTableItems } from "../staff/staff-columns";
import { EventEdit } from "./event-actions";

interface EventCardProps {
  currentUser: Staff;
  event: EventsWithRelation;
  setEventStateAction: Dispatch<SetStateAction<EventsWithRelation[]>>;
  allStaffInformation: StaffTableItems[];
}

export default function EventCard({
  currentUser,
  setEventStateAction,
  event,
  allStaffInformation,
}: EventCardProps) {
  const currentTime = new Date();
  const { isExpanded, toggleExpand, animatedHeight } = useExpandable();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      animatedHeight.set(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded, animatedHeight]);

  let progress = calculateProgress(event);

  let contributors: any = [...event.issues, ...event.pendingIssues]
    .map((issue) => {
      let contributor = allStaffInformation.find(
        (staff) => staff.id === issue.createdById
      );
      if (contributor) {
        return {
          name: contributor.name,
          image: contributor.image,
        };
      }
    })
    .filter(
      (contributor, index, self) =>
        contributor &&
        index === self.findIndex((c) => c?.name === contributor.name)
    );

  let changes = [...event.issues, ...event.pendingIssues]
    .flatMap((issue) => {
      return [
        {
          action: "created",
          date: issue.createdAt,
          by:
            allStaffInformation.find((staff) => staff.id === issue.createdById)
              ?.name || "Unknown",
          name: issue.name,
        },
        {
          action: "approved",
          date: issue.approvedAt,
          by:
            allStaffInformation.find((staff) => staff.id === issue.createdById)
              ?.name || "Unknown",
          name: issue.name,
        },
      ];
    })
    .filter((change) => change.date)
    .sort(
      (a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    )
    .slice(0, 5)
    .map(
      (change) =>
        `${change.name} was ${change.action} by ${change.by} on ${change.date ? new Date(change.date).toLocaleDateString() : "Unknown date"}`
    );

  return (
    <Card
      className="w-full max-w-md cursor-pointer transition-all duration-300 hover:shadow-lg"
      onClick={toggleExpand}
    >
      <CardHeader className="space-y-1">
        <div className="flex w-full items-start justify-between">
          <div className="space-y-2">
            <Badge
              variant="secondary"
              className={
                new Date(event.end).getTime() < currentTime.getTime()
                  ? "bg-green-100 text-green-600"
                  : "bg-blue-100 text-blue-600"
              }
            >
              {new Date(event.end).getTime() < currentTime.getTime()
                ? "Completed"
                : "In Progress"}
            </Badge>
            <h3 className="text-2xl font-semibold">{event.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={hasPermission(currentUser, "edit:event")}
                  onClick={() => {
                    toggleExpand();
                    setIsOpen(true);
                  }}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={hasPermission(currentUser, "handle:event")}
                  onClick={() => {
                    toggleExpand();
                    setIsEndOpen(true);
                  }}
                >
                  <CalendarOff className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>End Event</p>
              </TooltipContent>
            </Tooltip>
            <AlertDialog open={isEndOpen} onOpenChange={setIsEndOpen}>
              <AlertDialogContent onClick={() => toggleExpand()}>
                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
                    aria-hidden="true"
                  >
                    <CircleAlert
                      className="opacity-80"
                      size={16}
                      strokeWidth={2}
                    />
                  </div>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                  </AlertDialogHeader>
                </div>
                <div className="flex flex-col space-y-2">
                  <span className="text-sm">
                    This action cannot be undone. This will end the event and
                    all the issues will not be drop able anymore!
                  </span>
                  {event.itemsReleaseType.map((type, index) => {
                    return (
                      <span
                        key={index}
                        className="text-xs text-muted-foreground"
                      >
                        {`${toUpperCase(type)}: ${event[type].length}`}
                        {index < event.itemsReleaseType.length - 1 && ", "}
                      </span>
                    );
                  })}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      toast.promise(endEvent(event.id), {
                        loading: "Loading...",
                        success: (response) => {
                          return response.message;
                        },
                        error: "Something went wrong. Please try again.",
                      });
                    }}
                  >
                    End Event
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Remaining Time</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={Number(progress)} className="h-2" />
          </div>

          <motion.div
            style={{ height: animatedHeight }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div ref={contentRef}>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4 pt-2"
                  >
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>End {formatTimestamp(new Date(event.end))}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <Icons.approve className="mr-1 h-4 w-4 text-yellow-400" />
                          <span>
                            {
                              [...event.pendingIssues, ...event.issues].map(
                                (x) => x.approvedAt != null
                              ).length
                            }
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Icons.addIssue className="mr-1 h-4 w-4" />
                          <span>
                            {event.issues.length + event.pendingIssues.length}{" "}
                            Issues
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="flex items-center text-sm font-medium">
                        <Users className="mr-2 h-4 w-4" />
                        Contributors
                      </h4>
                      <div className="flex -space-x-2">
                        {contributors.map((contributor: any, index: number) => (
                          <TooltipProvider key={index}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="border-2 border-white">
                                  <AvatarImage
                                    src={
                                      contributor.image ||
                                      `/placeholder.svg?height=32&width=32&text=${contributor.name[0]}`
                                    }
                                    alt={contributor.name}
                                  />
                                  <AvatarFallback>
                                    {contributor.name[0]}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{contributor.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Recent Changes</h4>
                      {changes.map((task, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600">{task}</span>

                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <AlertDialog>
                        <AlertDialogTrigger
                          asChild
                          disabled={
                            (!event.name.includes("Custom") &&
                              new Date(event.end).getTime() <
                                currentTime.getTime()) ||
                            hasPermission(currentUser, "handle:event")
                          }
                        >
                          <Button
                            className="w-full"
                            onClick={() => {
                              toggleExpand();
                            }}
                          >
                            <MessageSquare
                              className="-ms-1 me-2 opacity-60"
                              size={16}
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                            Release Event
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={() => toggleExpand()}>
                          <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                            <div
                              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
                              aria-hidden="true"
                            >
                              <CircleAlert
                                className="opacity-80"
                                size={16}
                                strokeWidth={2}
                              />
                            </div>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                            </AlertDialogHeader>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <span className="text-sm">
                              This action cannot be undone. This will release
                              the event and all its issues.
                            </span>
                            {event.itemsReleaseType.map((type, index) => {
                              const pendingName = ("pending" +
                                toUpperCase(type)) as ItemsType;

                              const approvedItems = event[pendingName].filter(
                                (item) => item.approvedAt !== null
                              );

                              return (
                                <span
                                  key={index}
                                  className="text-xs text-muted-foreground"
                                >
                                  {`Approved ${toUpperCase(type)}: ${approvedItems.length}`}
                                  {index < event.itemsReleaseType.length - 1 &&
                                    ", "}
                                </span>
                              );
                            })}
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                toast.promise(releaseEvent(event.id), {
                                  loading: "Loading...",
                                  success: (response) => {
                                    return response.message;
                                  },
                                  error:
                                    "Something went wrong. Please try again.",
                                });
                              }}
                            >
                              Release
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
        <EventEdit
          event={event}
          setEventStateAction={setEventStateAction}
          isOpen={isOpen}
          setIsOpenAction={setIsOpen}
          onClick={() => toggleExpand()}
        />
      </CardContent>

      <CardFooter>
        <div className="flex w-full items-center justify-between text-sm text-gray-600">
          <span>
            Last updated:
            {formatDistanceToNow(new Date(event.updatedAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

export function useExpandable(initialState = false) {
  const [isExpanded, setIsExpanded] = useState(initialState);

  const springConfig = { stiffness: 300, damping: 30 };
  const animatedHeight = useSpring(0, springConfig);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return { isExpanded, toggleExpand, animatedHeight };
}

function calculateProgress(event: EventsWithRelation) {
  const now = new Date();
  const totalDuration =
    new Date(event.end).getTime() - new Date(event.start).getTime();
  const elapsed = now.getTime() - new Date(event.start).getTime();

  const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  return progress.toFixed(2);
}
