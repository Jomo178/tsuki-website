"use server";

import { staffFormSchema, StaffFormSchemaType } from "@/container/staff/staff";
import { DiscordProfile } from "next-auth/providers/discord";

import { prisma } from "@/lib/database";
import { fetchUserProfilesFromDiscord } from "@/lib/session";

export async function addStaff(
  formData: StaffFormSchemaType
): Promise<{ message: string; staff?: DiscordProfile }> {
  const validatedFields = staffFormSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { message: "Not valid Data." };
  }

  const staffExists = await prisma.staff.findUnique({
    where: { discordId: formData.discordId },
  });

  if (staffExists) {
    return { message: "Staff already exists." };
  }

  const staffDiscordInfo = await fetchUserProfilesFromDiscord([
    formData.discordId,
  ]);

  if (!staffDiscordInfo[0].username) {
    return { message: "Please provide a valid Discord ID." };
  }

  const createStaff = await prisma.staff.create({
    data: {
      discordId: formData.discordId,
      role: formData.role,
      create: { set: formData.create },
      edit: { set: formData.edit },
      delete: { set: formData.delete },
      handle: { set: formData.handle },
    },
  });

  if (!createStaff) {
    return { message: "Failed to add staff." };
  }

  return { message: "Staff added successfully!", staff: staffDiscordInfo[0] };
}

export async function editStaff(formData: StaffFormSchemaType) {
  const validatedFields = staffFormSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { message: "Not valid Data." };
  }

  const staffExists = await prisma.staff.findUnique({
    where: { discordId: formData.discordId },
  });

  if (!staffExists) {
    return { message: "Staff does not exist." };
  }

  const staffDiscordInfo = await fetchUserProfilesFromDiscord([
    formData.discordId,
  ]);

  if (!staffDiscordInfo[0].username) {
    return { message: "Please provide a valid Discord ID." };
  }

  const updateStaff = await prisma.staff.update({
    where: { discordId: formData.discordId },
    data: {
      role: formData.role,
      create: { set: formData.create },
      edit: { set: formData.edit },
      delete: { set: formData.delete },
      handle: { set: formData.handle },
    },
  });

  if (!updateStaff) {
    return { message: "Failed to edit staff." };
  }

  return { message: "Staff edited successfully!", staff: staffDiscordInfo[0] };
}

export async function archiveStaff(discordId: string, isInTeam: boolean) {
  const staffExists = await prisma.staff.findUnique({
    where: { discordId },
  });

  if (!staffExists) {
    return { message: "Staff does not exist." };
  }

  const archiveStaff = await prisma.staff.update({
    where: { discordId },
    data: {
      isInTeam: !isInTeam,
    },
  });

  return {
    message: `Staff ${isInTeam ? "archived" : "unarchived"} successfully!`,
  };
}
