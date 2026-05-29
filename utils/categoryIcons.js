import {
  BadgeCheck,
  BarChart3,
  Bot,
  BrainCircuit,
  Briefcase,
  Building2,
  Clapperboard,
  Code2,
  Compass,
  Dumbbell,
  FileText,
  Gamepad2,
  GraduationCap,
  Headset,
  HeartPulse,
  ImageIcon,
  LayoutTemplate,
  Leaf,
  Lightbulb,
  Mail,
  Megaphone,
  MessageSquareQuote,
  Microscope,
  Music4,
  Palette,
  PenSquare,
  PenTool,
  Plane,
  PlayCircle,
  Rocket,
  Scale,
  Search,
  Share2,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Utensils,
  Wallet,
  WandSparkles,
  Workflow,
  AtSign,
  Hash
} from "lucide-react";

export const categoryIconMap = {
  marketing: Megaphone,
  ai: BrainCircuit,
  coding: Code2,
  code: Code2,
  development: Code2,
  business: Briefcase,
  resume: FileText,
  career: BadgeCheck,
  writing: PenTool,
  "content writing": PenSquare,
  content: PenSquare,
  "social media": Share2,
  social: Share2,
  instagram: AtSign,
  youtube: PlayCircle,
  linkedin: Share2,
  twitter: Hash,
  "x": Hash,
  "ai tools": Bot,
  tools: Bot,
  "image prompts": ImageIcon,
  automation: Workflow,
  productivity: Rocket,
  education: GraduationCap,
  "learning & education": GraduationCap,
  finance: Wallet,
  health: HeartPulse,
  fitness: Dumbbell,
  design: Palette,
  "ui ux": LayoutTemplate,
  "ui/ux": LayoutTemplate,
  ux: LayoutTemplate,
  seo: Search,
  email: Mail,
  "customer support": Headset,
  support: Headset,
  sales: TrendingUp,
  ecommerce: ShoppingCart,
  "e-commerce": ShoppingCart,
  startup: Lightbulb,
  "business & startup": Lightbulb,
  legal: Scale,
  "real estate": Building2,
  lifestyle: Compass,
  sustainability: Leaf,
  travel: Plane,
  food: Utensils,
  gaming: Gamepad2,
  music: Music4,
  video: Clapperboard,
  research: Microscope,
  "data analysis": BarChart3,
  analytics: BarChart3,
  hr: Users,
  interview: MessageSquareQuote,
  "programming & ai": Code2,
  "ai automation": Workflow,
  "health & fitness": HeartPulse,
  "health wellness": HeartPulse,
  "health & wellness": HeartPulse,
  "health fitness": HeartPulse,
  "personal growth": Lightbulb,
  "travel & lifestyle": Plane,
  "finance & money": Wallet,
  "legal & compliance": Scale,
  "prompt engineering": WandSparkles,
  prompt: WandSparkles
};

export const categoryColorMap = {
  marketing: "bg-green-100 text-green-700",
  coding: "bg-blue-100 text-blue-700",
  business: "bg-emerald-100 text-emerald-700",
  resume: "bg-lime-100 text-lime-700",
  career: "bg-lime-100 text-lime-700",
  writing: "bg-teal-100 text-teal-700",
  "content writing": "bg-teal-100 text-teal-700",
  "social media": "bg-green-100 text-green-700",
  "customer support": "bg-slate-100 text-slate-700",
  design: "bg-emerald-100 text-emerald-700",
  seo: "bg-lime-100 text-lime-700",
  sales: "bg-green-100 text-green-700",
  finance: "bg-emerald-100 text-emerald-700",
  education: "bg-teal-100 text-teal-700",
  "learning & education": "bg-teal-100 text-teal-700",
  "health & wellness": "bg-rose-100 text-rose-700",
  "personal growth": "bg-amber-100 text-amber-700",
  "travel & lifestyle": "bg-cyan-100 text-cyan-700",
  "finance & money": "bg-emerald-100 text-emerald-700",
  "legal & compliance": "bg-slate-100 text-slate-700",
  "ai automation": "bg-slate-100 text-slate-700",
  "programming & ai": "bg-blue-100 text-blue-700",
  "business & startup": "bg-amber-100 text-amber-700",
  "health & fitness": "bg-rose-100 text-rose-700",
  travel: "bg-cyan-100 text-cyan-700",
  ecommerce: "bg-orange-100 text-orange-700"
};

function normalizeCategory(category = "") {
  return String(category).toLowerCase().trim().replace(/\s+/g, " ");
}

export function getCategoryIcon(category = "") {
  const normalized = normalizeCategory(category);
  
  // First try exact match
  if (categoryIconMap[normalized]) {
    return categoryIconMap[normalized];
  }
  
  // Fall back to keyword matching - check if category contains any mapped keyword
  for (const key in categoryIconMap) {
    if (normalized.includes(key)) {
      return categoryIconMap[key];
    }
  }
  
  return Sparkles;
}

export function getCategoryColor(category = "") {
  const normalized = normalizeCategory(category);
  
  // First try exact match
  if (categoryColorMap[normalized]) {
    return categoryColorMap[normalized];
  }
  
  // Fall back to keyword matching - check if category contains any mapped keyword
  for (const key in categoryColorMap) {
    if (normalized.includes(key)) {
      return categoryColorMap[key];
    }
  }
  
  return "bg-gray-100 text-gray-700";
}
