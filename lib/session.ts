"use server";

import { Staff } from "@prisma/client";
import { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { DiscordProfile } from "next-auth/providers/discord";

import { env } from "@/env";

import { authOptions } from "./authOptions";
import { prisma } from "./database";

export async function getCurrentUser<T extends boolean>(
  isStaff: T
): Promise<
  T extends false
    ? Session["user"] | null
    : { session: Session["user"] | null; staff: Staff }
> {
  const session = await getServerSession(authOptions);

  if (!isStaff) {
    // Explicit return for T extends false
    return (session?.user ?? null) as T extends false
      ? Session["user"] | null
      : never;
  }

  const findStaff = await prisma.staff.findUnique({
    where: { discordId: session?.user?.id ?? "" },
  });

  if (!findStaff) {
    // Explicit return for T extends false (fallback for staff not found)
    return (session?.user ?? null) as T extends false
      ? Session["user"] | null
      : never;
  }

  // Explicit return for T extends true
  return {
    session: session?.user ?? null,
    staff: findStaff,
  } as any;
}

export async function fetchUserProfilesFromDiscord(
  ids: string[],
  batchSize: number = 3, // Reduced batch size for better reliability
  initialDelay: number = 500 // Increased initial delay between batches
): Promise<DiscordProfile[]> {
  const fetchProfileWithRetry = async (
    id: string,
    retries = 3,
    backoff = 1000
  ): Promise<DiscordProfile> => {
    try {
      const response = await fetch(`https://discord.com/api/users/${id}`, {
        headers: {
          Authorization: `Bot ${env.DISCORD_CLIENT_TOKEN}`,
        },
      });

      // Handle rate limiting explicitly
      if (response.status === 429) {
        const retryAfter =
          parseInt(response.headers.get("retry-after") || "5", 10) * 1000;
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        return fetchProfileWithRetry(id, retries, backoff);
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch profile for ID ${id}: ${response.status} ${response.statusText}`
        );
      }

      const data: DiscordProfile = await response.json();

      if (data.avatar === null) {
        data.avatar = `https://cdn.discordapp.com/embed/avatars/${
          parseInt(data.discriminator) % 5
        }.png`;
      } else {
        const format = data.avatar.startsWith("a_") ? "gif" : "png";
        data.avatar = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.${format}`;
      }

      return data;
    } catch (error) {
      if (retries > 0) {
        console.log(
          `Error fetching ID ${id}, retrying... (${retries} attempts left)`
        );
        await new Promise((resolve) => setTimeout(resolve, backoff));
        return fetchProfileWithRetry(id, retries - 1, backoff * 2);
      }
      throw error;
    }
  };

  let results: DiscordProfile[] = [];
  let currentDelay = initialDelay;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);

    try {
      // Process each batch sequentially to reduce load
      const batchResults = [];
      for (const id of batch) {
        try {
          const profile = await fetchProfileWithRetry(id);
          batchResults.push({ status: "fulfilled", value: profile });
        } catch (error) {
          console.error(`Failed to fetch profile for ID ${id}:`, error);
          batchResults.push({ status: "rejected", reason: error });
        }

        // Small delay between individual requests in the same batch
        if (id !== batch[batch.length - 1]) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      // Filter successful results
      results = results.concat(
        batchResults.flatMap((res: any) =>
          res.status === "fulfilled" ? [res.value] : []
        )
      );

      // Wait between batches with adaptive delay
      if (i + batchSize < ids.length) {
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
      }
    } catch (error) {
      console.error(`Error processing batch:`, error);
      // If we encounter an error, increase the delay for the next batch
      currentDelay = Math.min(currentDelay * 1.5, 10000); // Up to 10 seconds max
    }
  }

  return results;
}
