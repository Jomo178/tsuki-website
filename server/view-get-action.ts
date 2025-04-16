"use server";

import {
  IssuesWithRelation,
  PendingIssuesWithRelation,
} from "@/types/prisma-relations";
import { ItemsNameType } from "@/types/view";
import { prisma } from "@/lib/database";

type ReleasedItemReturnType<T extends ItemsNameType> = T extends "issues"
  ? IssuesWithRelation[]
  : never;

type PendingItemReturnType<T extends ItemsNameType> = T extends "issues"
  ? PendingIssuesWithRelation[]
  : never;

export async function getPendingItems<T extends ItemsNameType>(
  itemType: T,
  skip: number,
  amount: number,
  filter: any,
  orderBy: any
): Promise<PendingItemReturnType<T>> {
  const whereObj = {
    skip,
    take: amount,
    where: {
      ...filter,
      rejections: {
        every: {
          resubmitted: true,
        },
      },
      approvedBy: null,
    },
    orderBy,
    include: {
      createdBy: true,
      approvedBy: true,
      event: true,
      rejections: {
        include: {
          rejectedBy: true,
          resubmittedBy: true,
        },
      },
    },
  };
  return (await PendingItemsSwitch(
    whereObj,
    itemType
  )) as PendingItemReturnType<T>;
}

export async function getRejectedItems<T extends ItemsNameType>(
  itemType: T,
  skip: number,
  amount: number,
  filter: any,
  orderBy: any
): Promise<PendingItemReturnType<T>> {
  const whereObj = {
    skip,
    take: amount,
    where: {
      ...filter,
      rejections: {
        some: {
          resubmitted: false,
        },
      },
    },
    orderBy,
    include: {
      createdBy: true,
      approvedBy: true,
      event: true,
      rejections: {
        include: {
          rejectedBy: true,
          resubmittedBy: true,
        },
      },
    },
  };

  return (await PendingItemsSwitch(
    whereObj,
    itemType
  )) as PendingItemReturnType<T>;
}

export async function getUpcomingItems<T extends ItemsNameType>(
  itemType: T,
  skip: number,
  amount: number,
  filter: any,
  orderBy: any
): Promise<ReleasedItemReturnType<T>> {
  const whereObj = {
    skip,
    take: amount,
    where: {
      ...filter,
      approvedBy: {
        id: {
          not: undefined,
        },
      },
    },
    orderBy,
    include: {
      createdBy: true,
      approvedBy: true,
      event: true,
      rejections: {
        include: {
          rejectedBy: true,
          resubmittedBy: true,
        },
      },
    },
  };

  return (await PendingItemsSwitch(
    whereObj,
    itemType
  )) as ReleasedItemReturnType<T>;
}

export async function getReleasedItems<T extends ItemsNameType>(
  itemType: T,
  skip: number,
  amount: number,
  filter: any,
  orderBy: any
): Promise<ReleasedItemReturnType<T>> {
  const whereObj = {
    skip,
    take: amount,
    where: {
      ...filter,
      approvedBy: {
        id: {
          not: undefined,
        },
      },
      createdBy: {
        id: {
          not: undefined,
        },
      },
      approvedAt: {
        not: undefined,
      },
      eventId: {
        not: undefined,
      },
    },
    orderBy,
    include: {
      createdBy: true,
      approvedBy: true,
      event: true,
      rejections: {
        include: {
          rejectedBy: true,
          resubmittedBy: true,
        },
      },
    },
  };

  return (await ReleasedItemsSwitch(
    whereObj,
    itemType
  )) as ReleasedItemReturnType<T>;
}

async function ReleasedItemsSwitch(whereObj: any, itemType: ItemsNameType) {
  switch (itemType) {
    case "issues":
      return await prisma.issues.findMany(whereObj);
  }
}

async function PendingItemsSwitch(whereObj: any, itemType: ItemsNameType) {
  switch (itemType) {
    case "issues":
      return await prisma.pendingIssues.findMany(whereObj);
  }
}
