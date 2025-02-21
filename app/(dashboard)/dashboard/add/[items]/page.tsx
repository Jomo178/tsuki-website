import Link from "next/link";
import { notFound } from "next/navigation";
import AddCarousel from "@/container/add/add-carousel";
import { getAllEvents, getCurrentEvent } from "@/server/events-action";
import { ItemsType } from "@prisma/client";

import { getCurrentUser } from "@/lib/session";
import { toUpperCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getAllRarities } from "../../action";

export async function generateStaticParams() {
  const types = Object.values(ItemsType);
  return types.map((type) => ({
    items: type,
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ items: ItemsType }>;
}) {
  const { items } = await params;
  const issueEvent = await getCurrentEvent([items]);
  const allEvents = await getAllEvents();
  const getCurrentStaff = await getCurrentUser(true);
  if (!getCurrentStaff?.staff || !getCurrentStaff.staff.isInTeam)
    return notFound();

  return (
    <Tabs
      defaultValue="issues"
      className="py-6 sm:ml-auto sm:mr-auto sm:max-h-fit sm:min-w-[400px] sm:max-w-fit sm:px-6 md:p-11"
    >
      <TabsList className="w-full">
        <TabsTrigger value={"issues"} className="h-full w-full">
          {toUpperCase("issues")}
        </TabsTrigger>
        <TabsTrigger disabled value={"events"} className="h-full w-full">
          {toUpperCase("events")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="issues">
        <Card className="ml-auto mr-auto max-h-fit max-w-fit p-6 md:p-11">
          <CardContent>
            {!issueEvent ? (
              <EmptyState
                className="border-none"
                title={`No Issue event found`}
                description={`Please create an issue event first`}
                action={
                  <Link href="/dashboard/events" prefetch={true}>
                    <Button variant="outline">Create Event</Button>
                  </Link>
                }
              />
            ) : (
              <AddCarousel
                currentUser={getCurrentStaff.staff}
                event={issueEvent}
                events={allEvents}
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
