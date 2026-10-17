import { Redirect } from "expo-router";

import { ROUTES } from "@constants";

export default function Index() {
  return <Redirect href={ROUTES.TABS} />;
}
