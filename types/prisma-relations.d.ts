import { Prisma } from "@prisma/client";

const itemsInclude = {
  createdBy: true,
  approvedBy: true,
  event: true,
  rejections: {
    include: {
      rejectedBy: true,
      resubmittedBy: true,
    },
  },
} as const;

export type IssuesWithRelation = Prisma.IssuesGetPayload<{
  include: typeof itemsInclude;
}>;

export type PendingIssuesWithRelation = Prisma.PendingIssuesGetPayload<{
  include: typeof itemsInclude;
}>;

export type EventsWithRelation = Prisma.EventsGetPayload<{
  include: { createdBy: true; issues: true; pendingIssues: true };
}>;
