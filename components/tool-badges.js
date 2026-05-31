"use client";

const toolIconPaths = {
  chatgpt: "/icons/chatgpt.svg",
  claude: "/icons/claude.svg",
  gemini: "/icons/gemini.svg",
  midjourney: "/icons/midjourney.svg",
  perplexity: "/icons/perplexity-ai-icon.svg",
  canva: "/icons/canva-icon.svg"
};

function getToolIcon(tool) {
  return toolIconPaths[String(tool || "").trim().toLowerCase()];
}

export function ToolBadges({ tools = [], compact = false }) {
  const visibleTools = tools.filter(Boolean).slice(0, compact ? 2 : 3);
  const remainingCount = Math.max(tools.filter(Boolean).length - visibleTools.length, 0);

  if (!visibleTools.length) {
    return null;
  }

  return (
    <div
      aria-label={`Works with ${tools.filter(Boolean).join(", ")}`}
      className={`tool-badges${compact ? " compact" : ""}`}
    >
      <span className="tool-badges-label">Works with</span>
      <div className="tool-badges-list">
        {visibleTools.map((tool) => {
          const icon = getToolIcon(tool);

          return (
            <span className="tool-badge" key={tool} title={tool}>
              {icon ? (
                <img alt="" aria-hidden="true" src={icon} />
              ) : (
                <span aria-hidden="true" className="tool-badge-fallback">
                  {String(tool).slice(0, 1)}
                </span>
              )}
              <span>{tool}</span>
            </span>
          );
        })}
        {remainingCount ? (
          <span className="tool-badge tool-badge-more">{remainingCount} more</span>
        ) : null}
      </div>
    </div>
  );
}
