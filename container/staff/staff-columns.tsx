"use client";

import { AuthorizationType, Staff, StaffRole } from "@prisma/client";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Session } from "next-auth";

import { cn, formatTimestamp, toUpperCase } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { RowActions } from "./staff-row-actions";

export type StaffTableItems = Staff & Session["user"] & { status: string };

const multiColumnFilterFn: FilterFn<StaffTableItems> = (
  row,
  columnId,
  filterValue
) => {
  const searchableRowContent =
    `${row.original.name} ${row.original.email} ${row.original.global_name}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

const statusFilterFn: FilterFn<StaffTableItems> = (
  row,
  columnId,
  filterValue: string[]
) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId) as string;
  return filterValue.includes(status);
};

export const staffColumns: ColumnDef<StaffTableItems>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    size: 28,
    enableSorting: false,
    enableHiding: false,
  },
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <img
          className="rounded-full"
          src={row.original.image ?? "/images/tsuki.png"}
          width={40}
          height={40}
          alt={row.getValue("name")}
        />
        <div>
          <div className="font-medium">{row.original.global_name}</div>
          <span className="mt-0.5 text-xs text-muted-foreground">
            @{row.getValue("name")}
          </span>
        </div>
      </div>
    ),
    size: 180,
    filterFn: multiColumnFilterFn,
    enableHiding: false,
  },
  {
    header: "Email",
    accessorKey: "email",
    size: 180,
  },
  {
    header: "Role",
    accessorKey: "role",
    cell: ({ row }) => toUpperCase(row.getValue("role")),
    sortingFn: (a, b) => {
      const roleOrder = Object.values(StaffRole);
      return (
        roleOrder.indexOf(a.original.role) - roleOrder.indexOf(b.original.role)
      );
    },
    size: 100,
  },
  {
    header: "Joined",
    accessorKey: "createdAt",
    cell: ({ row }) => (
      <span suppressHydrationWarning>
        {formatTimestamp(new Date(row.getValue("createdAt")))}
      </span>
    ),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => (
      <Badge
        className={cn(
          row.getValue("status") === "Inactive" &&
            "bg-muted-foreground/60 text-primary-foreground"
        )}
      >
        {row.getValue("status")}
      </Badge>
    ),
    size: 100,
    filterFn: statusFilterFn,
  },
  {
    header: "Permissions",
    accessorKey: "permissions",
    cell: ({ row }) => {
      const staff = row.original;
      const hasCreatePermissions = staff.create.length > 0;
      const hasEditPermissions = staff.edit.length > 0;
      const hasDeletePermissions = staff.delete.length > 0;
      const hadHandlePermissions = staff.handle.length > 0;
      const permissions = Object.values(AuthorizationType);

      return (
        <div className="grid grid-cols-2 gap-2">
          {hasCreatePermissions && (
            <Badge className="min-w-fit">
              Create {permissions.length}/{staff.create.length}
            </Badge>
          )}
          {hasEditPermissions && (
            <Badge className="min-w-fit">
              Edit {permissions.length}/{staff.edit.length}
            </Badge>
          )}
          {hasDeletePermissions && (
            <Badge className="min-w-fit">
              Delete {permissions.length}/{staff.delete.length}
            </Badge>
          )}
          {hadHandlePermissions && (
            <Badge className="min-w-fit">
              Handle {permissions.length}/{staff.handle.length}
            </Badge>
          )}
        </div>
      );
    },
    enableSorting: false,
    size: 200,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => (
      <RowActions
        row={row}
        setDataAction={table.options.meta?.setDataAction ?? (() => {})}
        currentUser={table.options.meta?.curentUser}
      />
    ),
    size: 60,
    enableHiding: false,
  },
];
