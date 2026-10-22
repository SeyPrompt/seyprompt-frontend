import { Lightbulb } from "lucide-react";
import { ProtectedImage, ProtectedMediaFrame, ProtectedVideo } from "@/components/protected-media";

function SampleOutputDisplay({ prompt }) {
  const sampleOutput = prompt.sampleOutput;

  if (!sampleOutput) {
    return (
      <div className="sample-empty-state">
        <span>Sample output</span>
        <strong>Preview not added yet</strong>
        <p>The reusable prompt is still available after unlock.</p>
      </div>
    );
  }

  if (typeof sampleOutput === "string") {
    return <div className="prose content-box sample-box">{sampleOutput}</div>;
  }

  if (sampleOutput.type === "text") {
    return <div className="prose content-box sample-box">{sampleOutput.value}</div>;
  }

  if (sampleOutput.type === "image") {
    const previewUrl =
      sampleOutput.watermarkedPreviewUrl || prompt.watermarkedPreviewUrl || sampleOutput.value;

    return (
      <ProtectedMediaFrame className="sample-media-box">
        <ProtectedImage
          alt={sampleOutput.fileName || `${prompt.title} sample output`}
          className="sample-output-image"
          fetchPriority="high"
          height={900}
          loading="eager"
          sizes="(max-width: 760px) 100vw, (max-width: 1180px) 62vw, 900px"
          src={previewUrl}
          width={1200}
          widths={[480, 720, 960, 1200, 1440]}
        />
      </ProtectedMediaFrame>
    );
  }

  if (sampleOutput.type === "video") {
    const previewUrl =
      sampleOutput.watermarkedPreviewUrl || prompt.watermarkedPreviewUrl || sampleOutput.value;

    return (
      <ProtectedMediaFrame className="sample-media-box">
        <ProtectedVideo className="sample-output-video" controls preload="metadata" src={previewUrl} />
      </ProtectedMediaFrame>
    );
  }

  if (sampleOutput.type === "pdf" || sampleOutput.type === "file") {
    const label = sampleOutput.type === "pdf" ? "Open PDF" : "Open File";

    return (
      <div className="sample-media-box">
        <a
          className="button-secondary"
          href={sampleOutput.value}
          rel="noopener noreferrer"
          target="_blank"
        >
          {label}
        </a>
      </div>
    );
  }

  return null;
}

export function PromptSamplePanel({ prompt }) {
  return (
    <section className="prompt-workspace-panel prompt-workspace-sample">
      <div className="prompt-workspace-heading">
        <p className="eyebrow">Sample output</p>
      </div>
      <SampleOutputDisplay prompt={prompt} />
    </section>
  );
}

export function PromptTips({ prompt }) {
  const tips = String(prompt?.tips || prompt?.notes || "").trim();
  if (!tips) return null;

  return (
    <aside className="prompt-tips-box" aria-labelledby="prompt-tips-heading">
      <div className="prompt-tips-icon" aria-hidden="true"><Lightbulb size={18} /></div>
      <div className="prompt-tips-copy">
        <h3 id="prompt-tips-heading">Tips</h3>
        <div className="prose prompt-tips-scroll" role="region" aria-label="Prompt tips" tabIndex={0}>
          {tips}
        </div>
      </div>
    </aside>
  );
}
