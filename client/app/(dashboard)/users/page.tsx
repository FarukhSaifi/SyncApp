"use client";

import dynamic from "next/dynamic";

const Users = dynamic(() => import("@views/Users"), { ssr: false });

export default function UsersPage() {
  return <Users />;
}
