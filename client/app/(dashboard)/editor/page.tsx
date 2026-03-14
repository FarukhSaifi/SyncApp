"use client";

import dynamic from "next/dynamic";
import { usePostsContext } from "../../dashboard-layout";

const Editor = dynamic(() => import("@views/Editor"), { ssr: false });

export default function EditorNewPage() {
  const { onPostCreate, onPostUpdate } = usePostsContext();
  return <Editor onPostCreate={onPostCreate} onPostUpdate={onPostUpdate} />;
}
