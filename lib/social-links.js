export const socialLinks = [
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/seyprompt",
    isLive: true,
  },
  {
    id: "pinterest",
    label: "Pinterest",
    href: "https://www.pinterest.com/seyprompt",
    isLive: true,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/seyprompt/",
    isLive: true,
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "",
    isLive: false,
  },
];

export const liveSocialLinks = socialLinks.filter((link) => link.isLive && link.href);
