"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const tabs = [
  { label: "Users", href: "/dashboard/users", match: "/dashboard/users" },
  { label: "Roles", href: "/dashboard/users/roles", match: "/dashboard/users/roles" },
  { label: "Permissions", href: "/dashboard/users/permissions", match: "/dashboard/users/permissions" },
];

export default function UserManagementTabs() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 border-b pb-3">
      {tabs.map((tab) => {
        const active = pathname === tab.match;
        return (
          <Button key={tab.href} asChild variant={active ? "default" : "ghost"} size="sm">
            <Link href={tab.href}>{tab.label}</Link>
          </Button>
        );
      })}
    </div>
  );
}
