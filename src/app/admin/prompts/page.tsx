import type { Metadata } from "next";
import { PromptsView } from "./prompts-view";

export const metadata: Metadata = { title: "Prompt Templates" };

export default function PromptTemplatesPage() {
  return <PromptsView />;
}
