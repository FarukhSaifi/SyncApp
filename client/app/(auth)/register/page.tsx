"use client";

import dynamic from "next/dynamic";

const Register = dynamic(() => import("@views/Register"), { ssr: false });

export default function RegisterPage() {
  return <Register />;
}
