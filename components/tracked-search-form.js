"use client";

import { Search } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export function TrackedSearchForm({ className = "", placeholder = "Search prompts, tags, tools..." }) {
  return (
    <form
      action="/prompts"
      className={className}
      onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);

        trackEvent("prompt_search", {
          event_category: "Search",
          search_term: formData.get("q") || "",
          search_source: "home_hero"
        });
      }}
    >
      <input name="q" placeholder={placeholder} />
      <button className="button" type="submit">
        <Search aria-hidden="true" size={18} />
        Search
      </button>
    </form>
  );
}
