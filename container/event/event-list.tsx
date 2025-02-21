"use client";

import { useState } from "react";
import { Staff } from "@prisma/client";

import { EventsWithRelation } from "@/types/prisma-relations";

import { StaffTableItems } from "../staff/staff-columns";
import { EventAdd } from "./event-actions";
import EventCard from "./event-card";

interface EventsListProps {
  currentUser: Staff;
  events: EventsWithRelation[];
  allStaffInformation: StaffTableItems[];
}

function EventsList({
  currentUser,
  events,
  allStaffInformation,
}: EventsListProps) {
  const [eventState, setEventState] = useState<EventsWithRelation[]>(events);
  const currentDate = new Date();
  const currentEvents = eventState.filter(
    (event) =>
      new Date(event.start) <= currentDate && new Date(event.end) >= currentDate
  );
  const pastEvents = eventState
    .filter((event) => new Date(event.end) < currentDate)
    .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime());

  const upcomingEvents = eventState.filter(
    (event) => new Date(event.start) > currentDate
  );

  let nextEvent: EventsWithRelation | null = null;
  if (upcomingEvents.length > 0) {
    nextEvent = upcomingEvents.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    )[0];

    if (nextEvent.name.includes("Tsuki Release")) {
      const alternativeEvent = upcomingEvents.find(
        (event) => !event.name.includes("Tsuki Release")
      );

      if (alternativeEvent) {
        nextEvent = alternativeEvent;
        upcomingEvents.splice(upcomingEvents.indexOf(alternativeEvent), 1);
      }
    } else {
      upcomingEvents.splice(upcomingEvents.indexOf(nextEvent), 1);
    }
  }

  return (
    <div className="container mt-10 space-y-5">
      <div>
        <EventAdd
          currentUser={currentUser}
          setEventStateAction={setEventState}
        />
      </div>
      {currentEvents ? (
        <section>
          <h2 className="mb-4 text-xl font-bold">
            {currentEvents.length > 0 ? "Current Events" : "Current Event"}
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {currentEvents.map((event, index) => (
              <EventCard
                event={event}
                setEventStateAction={setEventState}
                currentUser={currentUser}
                allStaffInformation={allStaffInformation}
                key={index}
              />
            ))}
          </div>
        </section>
      ) : (
        nextEvent && (
          <section>
            <h2 className="mb-4 text-xl font-bold">Next Event</h2>
            <div className="grid grid-cols-1 gap-5">
              <EventCard
                event={nextEvent}
                setEventStateAction={setEventState}
                currentUser={currentUser}
                allStaffInformation={allStaffInformation}
              />
            </div>
          </section>
        )
      )}

      {pastEvents.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">
            {pastEvents.length > 0 ? "Past Events" : "Past Event"}
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pastEvents.map((event, index) => (
              <EventCard
                event={event}
                setEventStateAction={setEventState}
                currentUser={currentUser}
                allStaffInformation={allStaffInformation}
                key={index}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default EventsList;
