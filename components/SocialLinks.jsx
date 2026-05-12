import { liveSocialLinks } from "@/lib/social-links";

function SocialIcon({ id }) {
  if (id === "instagram") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="instagram-logo-gradient" x1="3" x2="21" y1="21" y2="3">
            <stop offset="0" stopColor="#FEDA75" />
            <stop offset="0.28" stopColor="#FA7E1E" />
            <stop offset="0.55" stopColor="#D62976" />
            <stop offset="0.78" stopColor="#962FBF" />
            <stop offset="1" stopColor="#4F5BD5" />
          </linearGradient>
        </defs>
        <rect fill="url(#instagram-logo-gradient)" x="2.75" y="2.75" width="18.5" height="18.5" rx="5.4" />
        <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
        <circle cx="17.25" cy="6.75" r="1.25" fill="#fff" />
      </svg>
    );
  }

  if (id === "linkedin") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect fill="#0A66C2" x="3" y="3" width="18" height="18" rx="3.2" />
        <path fill="#fff" d="M7.15 10.1h3v7.7h-3z" />
        <path fill="#fff" d="M8.65 8.95a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1z" />
        <path fill="#fff" d="M11.65 10.1h2.88v1.05c.42-.65 1.2-1.2 2.48-1.2 2.03 0 3.19 1.32 3.19 3.87v3.98h-3v-3.54c0-1.13-.4-1.9-1.41-1.9-.77 0-1.23.52-1.43 1.02-.07.18-.09.43-.09.68v3.74h-3z" />
      </svg>
    );
  }

  if (id === "youtube") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect fill="#FF0000" x="2.5" y="6" width="19" height="12" rx="3.6" />
        <path fill="#fff" d="m10.5 9.1 5.4 2.9-5.4 2.9z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle fill="#BD081C" cx="12" cy="12" r="9.4" />
      <path fill="#fff" d="M12.15 5.65c-3.02 0-5.05 2.04-5.05 4.72 0 1.9 1.05 3.2 2.46 3.2.4 0 .62-1.1.62-1.42 0-.37-.94-1.15-.94-2.69 0-1.9 1.45-3.24 3.32-3.24 1.61 0 2.8.91 2.8 2.59 0 1.25-.5 3.58-2.13 3.58-.59 0-1.1-.43-1.1-1.04 0-.9.63-1.77.63-2.7 0-1.58-2.24-1.29-2.24.62 0 .4.05.83.23 1.2-.33 1.39-1.02 3.48-1.02 4.91 0 .44.06.88.1 1.32l.08.09.13-.05c1.2-1.64 1.16-1.96 1.7-4.1.29.55 1.04.84 1.64.84 2.52 0 3.66-2.46 3.66-4.68 0-2.41-2.08-4.15-4.91-4.15z" />
    </svg>
  );
}

export function SocialLinks({ className = "", label = "SeyPrompt social links" }) {
  if (!liveSocialLinks.length) {
    return null;
  }

  return (
    <nav className={`social-links ${className}`.trim()} aria-label={label}>
      {liveSocialLinks.map((link) => (
        <a
          aria-label={`Follow SeyPrompt on ${link.label}`}
          className={`social-link social-link-${link.id}`}
          href={link.href}
          key={link.id}
          rel="noopener noreferrer"
          target="_blank"
          title={link.label}
        >
          <SocialIcon id={link.id} />
          <span>{link.label}</span>
        </a>
      ))}
    </nav>
  );
}
