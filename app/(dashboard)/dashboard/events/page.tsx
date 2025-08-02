import { notFound } from "next/navigation";
import EventsList from "@/container/event/event-list";
import { getAllEvents } from "@/server/events-action";

import { getCurrentUser } from "@/lib/session";

import { getStaffAllInformation } from "../action";

export default async function Page() {
  const [events, staffItems, currentUser] = await Promise.all([
    getAllEvents(),
    getStaffAllInformation(),
    getCurrentUser(true),
  ]);

  if (!currentUser?.staff || !currentUser.staff.isInTeam) {
    notFound();
  }

  return (
    <div className="px-4 sm:px-6">
      <EventsList
        events={events}
        currentUser={currentUser.staff}
        allStaffInformation={staffItems}
      />
    </div>
  );
}
