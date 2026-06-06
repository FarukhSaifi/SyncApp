import GenerateImageScreen from "@/src/screens/GenerateImageScreen";
import { useLocalSearchParams } from "expo-router";

export default function GenerateImageRoute() {
  const { topic } = useLocalSearchParams<{ topic?: string }>();
  return <GenerateImageScreen defaultTopic={typeof topic === "string" ? topic : ""} />;
}
