import { redirect } from "next/navigation";

export default function ImageVideoPromptsPage() {
  redirect("/prompts?category=Image%20Prompts");
}
