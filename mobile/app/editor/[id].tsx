import EditorScreen from "@screens/EditorScreen";
import { useLocalSearchParams } from "expo-router";

export default function EditEditorRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditorScreen postId={id} />;
}
