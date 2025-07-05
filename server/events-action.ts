"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { eventFormSchema, EventFormSchemaType } from "@/container/event/event";
import { ItemsType } from "@prisma/client";

import { EventsWithRelation } from "@/types/prisma-relations";
import { prisma } from "@/lib/database";

export const getAllEvents = async (): Promise<EventsWithRelation[]> => {
  const events = await prisma.events.findMany({
    orderBy: {
      name: "desc",
    },
    include: {
      createdBy: true,
      issues: true,
      pendingIssues: true,
    },
  });
  return events;
};

export const getCurrentEvent = unstable_cache(
  async (items: ItemsType[]): Promise<EventsWithRelation | null> => {
    const futureEvent = await prisma.events.findFirst({
      where: {
        itemsReleaseType: { hasSome: items },
        start: { gt: new Date() },
      },
      orderBy: {
        start: "asc",
      },
      include: {
        createdBy: true,
        issues: true,
        pendingIssues: true,
      },
    });

    if (futureEvent) return futureEvent;

    const ongoingEvent = await prisma.events.findFirst({
      where: {
        itemsReleaseType: { hasSome: items },
        start: { lte: new Date() },
        end: { gt: new Date() },
      },
      orderBy: {
        start: "asc",
      },
      include: {
        createdBy: true,
        issues: true,
        pendingIssues: true,
      },
    });

    return ongoingEvent;
  },
  ["/dashboard/events"],
  { revalidate: 60 * 60 * 24, tags: ["current-event"] }
);

export async function addEvent(
  formData: EventFormSchemaType
): Promise<{ message: string; event?: EventsWithRelation }> {
  const validatedFields = eventFormSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { message: "Not valid Data." };
  }

  const eventExists = await prisma.events.findFirst({
    where: { name: formData.name },
  });

  if (eventExists) {
    return { message: "Event already exists." };
  }

  const event = await prisma.events.create({
    data: {
      name: formData.name,
      start: formData.start,
      end: formData.end,
      itemsReleaseType: formData.itemsReleaseType,
      createdById: formData.createdById,
    },
    include: {
      createdBy: true,
      issues: true,
      pendingIssues: true,
    },
  });

  revalidateTag("current-event");

  return { message: "Event added successfully!", event };
}

export async function editEvent(
  id: string,
  formData: EventFormSchemaType
): Promise<{ message: string; event?: EventsWithRelation }> {
  const validatedFields = eventFormSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { message: "Not valid Data." };
  }

  const eventExists = await prisma.events.findFirst({
    where: { id: id },
  });

  if (!eventExists) {
    return { message: "Event does not exist." };
  }

  const event = await prisma.events.update({
    where: { id: id },
    data: {
      name: formData.name,
      start: formData.start,
      end: formData.end,
      itemsReleaseType: formData.itemsReleaseType,
    },
    include: {
      createdBy: true,
      issues: true,
      pendingIssues: true,
    },
  });

  revalidateTag("current-event");

  return { message: "Event updated successfully!", event };
}

export async function releaseEvent(eventId: string) {
  return await prisma.$transaction(async (tx) => {
    const approvedPendingIssues = await tx.pendingIssues.findMany({
      where: {
        eventId,
        approvedById: {
          not: null,
        },
        approvedAt: {
          not: null,
        },
      },
      include: {
        event: true,
      },
    });

    if (approvedPendingIssues.length === 0) {
      return { message: "No approved pending issues found." };
    }

    const issuesData = approvedPendingIssues.map((pendingIssue) => ({
      name: pendingIssue.name,
      group: pendingIssue.group,
      era: pendingIssue.era,
      //TODO: Fix this
      rarity: pendingIssue.rarity as any,
      code: pendingIssue.code,
      image: pendingIssue.image,
      createdAt: pendingIssue.createdAt,
      updatedAt: pendingIssue.updatedAt,
      eventId: pendingIssue.eventId,
      createdById: pendingIssue.createdById,
      approvedById: pendingIssue.approvedById!,
      approvedAt: pendingIssue.approvedAt!,
      dropAble: pendingIssue.dropAble,
    }));

    await tx.issues.createMany({
      data: issuesData,
    });

    await tx.pendingIssues.deleteMany({
      where: {
        id: {
          in: approvedPendingIssues.map((pendingIssue) => pendingIssue.id),
        },
      },
    });

    return {
      message: "Approved pending issues successfully transferred to issues.",
    };
  });
}

export async function endEvent(eventId: string) {
  return await prisma.$transaction(async (tx) => {
    const event = await tx.issues.updateMany({
      where: { eventId: eventId },
      data: {
        dropAble: true,
      },
    });

    revalidateTag("current-event");
    return { message: "Event ended successfully!" };
  });
}
