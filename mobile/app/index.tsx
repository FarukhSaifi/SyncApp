import { Redirect } from "expo-router";

import { ROUTES } from "@/src/constants";

export default function Index() {
  return <Redirect href={ROUTES.TABS} />;
}
