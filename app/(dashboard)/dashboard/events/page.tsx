"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import EventsList from "@/container/event/event-list";
import { getAllEvents } from "@/server/events-action";

import { getCurrentUser } from "@/lib/session";

import { getStaffAllInformation } from "../action";

export default function Page() {
  const [events, setEvents] = useState<any[]>([]);
  const [staffItems, setStaffItems] = useState<any[]>([]);
  const [currentStaff, setCurrentStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [getEvents, staffItems, getCurrentStaff] = await Promise.all([
        getAllEvents(),
        getStaffAllInformation(),
        getCurrentUser(true),
      ]);
      if (!getCurrentStaff?.staff || !getCurrentStaff.staff.isInTeam) {
        setNotFoundState(true);
        setLoading(false);
        return;
      }
      setEvents(getEvents);
      setStaffItems(staffItems);
      setCurrentStaff(getCurrentStaff.staff);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (notFoundState) return notFound();

  return (
    <div className="px-4 sm:px-6">
      <EventsList
        events={events}
        currentUser={currentStaff}
        allStaffInformation={staffItems}
      />
    </div>
  );
}
