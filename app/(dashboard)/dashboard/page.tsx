import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboradActionsType } from "@/types";

import { viewDashboard } from "@/config/sidebar";
import { getCurrentUser } from "@/lib/session";

export default async function Page() {
  const getCurrentStaff = await getCurrentUser(true);

  if (!getCurrentStaff?.staff || !getCurrentStaff.staff.isInTeam)
    return notFound();

  return (
    <section
      id="features"
      className="container space-y-6 p-10 dark:bg-transparent md:py-12 lg:py-24"
    >
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Tsuki Dashboard
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Welcome to the Dashboard! Here you can choose from a variety of tools
          and resources to help you get things done better and faster.
        </p>
      </div>
      <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
        {viewDashboard[1].items.map((card, index) => (
          <Card
            key={index}
            href={card.href}
            Icon={card.Icon}
            title={card.title}
            description={card.description}
            disabled={card.disabled}
          />
        ))}
      </div>
    </section>
  );
}
function Card({
  href,
  Icon,
  title,
  description,
  disabled = false,
}: DashboradActionsType) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border bg-background p-2 transition-transform duration-200 ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:scale-105"
      }`}
    >
      {disabled ? (
        <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
          <Icon className="h-12 w-12" />
          <div className="space-y-2">
            <h3 className="font-bold">{title} (Coming Soon)</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      ) : (
        <Link href={href} passHref prefetch={true}>
          <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
            <Icon className="h-12 w-12" />
            <div className="space-y-2">
              <h3 className="font-bold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
