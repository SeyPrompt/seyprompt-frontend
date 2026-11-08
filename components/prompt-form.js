"use client";

import AdminSampleGallery from "./admin-sample-gallery";
import AdminPromptTaxonomy from "./admin-prompt-taxonomy";
import { UnsavedWarning } from "./admin-taxonomy-controls";
import { Lightbulb, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getPromptCategories, normalizeCategories } from "@/lib/prompt-metadata";

const MAX_SAMPLE_OUTPUT_FILE_SIZE = 10 * 1024 * 1024;
const SAMPLE_OUTPUT_URL_TYPES = ["image", "video", "pdf", "file"];
const SAMPLE_OUTPUT_TYPES = ["text", ...SAMPLE_OUTPUT_URL_TYPES];
const DEFAULT_REGIONAL_PRICES = [
  { region: "IN", currency: "INR", amount: 10, isActive: false },
  { region: "DEFAULT", currency: "USD", amount: 0.55, isActive: false }
];
const PRICING_REGION_OPTIONS = [
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "EU", label: "Europe" },
  { value: "NZ", label: "New Zealand" },
  { value: "DEFAULT", label: "Default / International" }
];
const REGION_CURRENCY_MAP = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  EU: "EUR",
  NZ: "NZD"
};
const PRICING_FIELDS = ["pricingType", "price", "currency", "isPurchasable", "creditUnlockEnabled", "directPurchaseEnabled", "creditCost", "regionalPrices"];
const CURRENCY_OPTIONS = ["INR", "USD", "GBP", "EUR", "NZD"];

function normalizeList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCategoryInput(value) {
  if (Array.isArray(value)) {
    return normalizeCategories(value);
  }

  try {
    const parsed = JSON.parse(String(value || "[]"));
    return normalizeCategories(parsed);
  } catch {
    return normalizeCategories(normalizeList(value));
  }
}

function currencyFractionDigits(currency) {
  return ["JPY", "KRW"].includes(String(currency || "").toUpperCase()) ? 0 : 2;
}

function minimumCheckoutAmount(currency) {
  return currencyFractionDigits(currency) === 0 ? 1 : 1;
}

function formatInrAmount(amount) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 2,
    style: "currency"
  }).format(Number(amount || 0));
}

function normalizeRegionalPriceForAdmin(price) {
  const currency = String(price?.currency || "").toUpperCase();
  const digits = currencyFractionDigits(currency);
  const amount =
    price?.amount !== undefined && price?.amount !== null
      ? Number(price.amount)
      : Number(price?.amountMinor || 0) / 10 ** digits;

  return {
    region: String(price?.region || "").toUpperCase(),
    currency,
    amount: Number.isFinite(amount) ? amount : 0,
    isActive: price?.isActive === true
  };
}

function getInitialRegionalPrices(value) {
  const prices = Array.isArray(value) && value.length ? value : DEFAULT_REGIONAL_PRICES;
  return prices.map((price, index) => ({
    id: `${price?.region || "region"}-${index}`,
    ...normalizeRegionalPriceForAdmin(price)
  }));
}

function getInitialPricingType(prompt) {
  return prompt?.pricingType === "premium" || prompt?.pricingType === "paid" || Number(prompt?.price || 0) > 0
    ? "premium"
    : "free";
}

function getRegionalPriceCurrencies(rows) {
  return [
    ...new Set(
      rows
        .map((row) => String(row.currency || "").trim().toUpperCase())
        .filter((currency) => currency && currency !== "INR")
    )
  ].sort();
}

function formatInrApproximation(row, fxRates) {
  const amount = Number(row.amount || 0);
  const currency = String(row.currency || "").toUpperCase();

  if (!amount || amount < 0) {
    return "-";
  }

  if (currency === "INR") {
    return formatInrAmount(amount);
  }

  const rate = fxRates[currency]?.rate;

  if (!rate) {
    return "Rate unavailable";
  }

  return `≈ ${formatInrAmount(amount * rate)}`;
}

function getRegionLabel(region) {
  return PRICING_REGION_OPTIONS.find((option) => option.value === region)?.label || region;
}

function getCurrencyForRegion(region, fallback = "USD") {
  const normalizedRegion = String(region || "").trim().toUpperCase();
  return REGION_CURRENCY_MAP[normalizedRegion] || String(fallback || "USD").trim().toUpperCase();
}

function getUsedRegions(rows, excludeRowId) {
  return new Set(
    rows
      .filter((row) => row.id !== excludeRowId)
      .map((row) => String(row.region || "").toUpperCase())
      .filter(Boolean)
  );
}

function getNextAvailableRegion(rows) {
  const usedRegions = getUsedRegions(rows);
  return PRICING_REGION_OPTIONS.find((option) => !usedRegions.has(option.value));
}

function findDuplicateRegion(rows) {
  const seen = new Set();

  for (const row of rows) {
    const region = String(row.region || "").toUpperCase();

    if (!region) {
      continue;
    }

    if (seen.has(region)) {
      return region;
    }

    seen.add(region);
  }

  return "";
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFileFromFormData(formData, fieldName) {
  const file = formData.get(fieldName);
  return file instanceof File && file.size > 0 ? file : null;
}

function validatePrompt(payload, sampleOutputFile, preservePricing = false) {
  if (!payload.title || payload.title.length < 3 || payload.title.length > 120) {
    return "Title must be between 3 and 120 characters.";
  }

  if (!payload.slug) {
    return "Slug is required.";
  }

  if (payload.listingType !== "external" && (!payload.prompt || payload.prompt.length < 10 || payload.prompt.length > 10000)) {
    return "Prompt must be between 10 and 10,000 characters.";
  }

  if (payload.category.length > 80) {
    return "Category must be 80 characters or fewer.";
  }

  if (payload.description.length > 1000) {
    return "Description must be 1,000 characters or fewer.";
  }

  if (payload.seoTitle.length > 70) {
    return "SEO title must be 70 characters or fewer.";
  }

  if (payload.seoDescription.length > 180) {
    return "SEO description must be 180 characters or fewer.";
  }

  if (payload.shareImage && !/^https?:\/\//i.test(payload.shareImage)) {
    return "Sharing image must be an absolute HTTP or HTTPS URL.";
  }

  if (payload.shareImageAlt.length > 180) {
    return "Sharing image alt text must be 180 characters or fewer.";
  }

  if (payload.tips.length > 5000) {
    return "Tips must be 5,000 characters or fewer.";
  }

  if (payload.notes.length > 5000) {
    return "Internal notes must be 5,000 characters or fewer.";
  }

  if (!Array.isArray(payload.categories)) {
    return "Categories must be a list.";
  }

  if (payload.categories.some((category) => !category || category.length > 80)) {
    return "Each category must be a non-empty value of 80 characters or fewer.";
  }

  if (payload.sampleOutput?.value?.length > 10000) {
    return "Sample output must be 10,000 characters or fewer.";
  }

  if (!SAMPLE_OUTPUT_TYPES.includes(payload.sampleOutputType)) {
    return "Sample output type must be text, image, video, PDF, or file.";
  }

  if (payload.sampleOutputUrl && !SAMPLE_OUTPUT_URL_TYPES.includes(payload.sampleOutputType)) {
    return "Direct sample output URL type must be image, video, PDF, or file.";
  }

  if (sampleOutputFile && sampleOutputFile.size > MAX_SAMPLE_OUTPUT_FILE_SIZE) {
    return "Sample output file must be 10 MB or smaller.";
  }

  if (!["free", "premium"].includes(payload.pricingType)) {
    return "Pricing type must be free or premium.";
  }

  if (!Number.isInteger(payload.creditCost) || payload.creditCost < 0) {
    return "Credit cost must be a whole number of credits.";
  }

  if (payload.pricingType === "premium" && payload.creditUnlockEnabled && payload.creditCost < 1) {
    return "Credit unlock needs a credit cost of at least 1.";
  }

  if (!Array.isArray(payload.regionalPrices)) {
    return "Regional prices must be valid JSON.";
  }

  if (payload.pricingType === "premium" && !preservePricing) {
    if (
      payload.directPurchaseEnabled &&
      !payload.regionalPrices.some((regionalPrice) => regionalPrice.isActive)
    ) {
      return "Direct purchase needs at least one active regional price.";
    }

    for (const regionalPrice of payload.regionalPrices) {
      if (
        !regionalPrice.region ||
        !regionalPrice.currency ||
        !Number.isFinite(Number(regionalPrice.amount)) ||
        Number(regionalPrice.amount) <= 0
      ) {
        return "Each regional price needs region, currency, and a positive amount.";
      }

      if (Number(regionalPrice.amount) < minimumCheckoutAmount(regionalPrice.currency)) {
        return `${regionalPrice.currency} checkout amount must be at least ${minimumCheckoutAmount(regionalPrice.currency)}.`;
      }
    }
  }

  if (!["public", "private"].includes(payload.visibility)) {
    return "Visibility must be public or private.";
  }

  if (!["draft", "published", "archived"].includes(payload.status)) {
    return "Status must be draft, published, or archived.";
  }

  if (
    payload.featuredOrder !== undefined &&
    (!Number.isFinite(payload.featuredOrder) || payload.featuredOrder < 0)
  ) {
    return "Featured order must be 0 or greater.";
  }

  return "";
}

function getInitialSampleOutput(prompt) {
  const sampleOutput = prompt?.sampleOutput;
  const topLevelType = String(prompt?.sampleOutputType || "").trim();
  const topLevelFileName = String(prompt?.sampleOutputFileName || "").trim();
  const validTopLevelType = SAMPLE_OUTPUT_TYPES.includes(topLevelType)
    ? topLevelType
    : "";

  if (sampleOutput && typeof sampleOutput === "object") {
    return {
      type: SAMPLE_OUTPUT_TYPES.includes(sampleOutput.type)
        ? sampleOutput.type
        : validTopLevelType || "text",
      value: sampleOutput.value || "",
      fileName: sampleOutput.fileName || topLevelFileName,
      provider: sampleOutput.provider || "",
      publicId: sampleOutput.publicId || "",
      resourceType: sampleOutput.resourceType || "",
      format: sampleOutput.format || "",
      bytes: sampleOutput.bytes || "",
      watermarkedPreviewUrl: sampleOutput.watermarkedPreviewUrl || prompt?.watermarkedPreviewUrl || ""
    };
  }

  return {
    type: validTopLevelType || "text",
    value: typeof sampleOutput === "string" ? sampleOutput : "",
    fileName: topLevelFileName,
    provider: "",
    publicId: "",
    resourceType: "",
    format: "",
    bytes: "",
    watermarkedPreviewUrl: ""
  };
}

export function PromptForm({ mode, prompt }) {
  const router = useRouter();
  const [taxonomy, setTaxonomy] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [pricingDirty, setPricingDirty] = useState(false);
  const [listingType, setListingType] = useState(prompt?.listingType || "prompt");
  const [priceBadge, setPriceBadge] = useState(prompt?.priceBadge || "hidden");
  const isExternal = listingType === "external";
  const preservePricing = !isExternal && mode === "edit" && !pricingDirty;
  const handleTaxonomyChange = useCallback((value, changed = false) => {
    setTaxonomy(value); if (changed) setDirty(true);
  }, []);
  const slugEditedRef = useRef(Boolean(prompt?.slug));
  const initialSampleOutput = getInitialSampleOutput(prompt);
  const [gallery, setGallery] = useState(() => ({ images: prompt?.sampleImages || [], coverId: prompt?.sampleCoverId || prompt?.sampleImages?.[0]?.id || '', mode: prompt?.samplePromptMode || 'single' }));
  const [galleryDirty, setGalleryDirty] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const handleGalleryChange = value => { setGallery(value); setGalleryDirty(true); setDirty(true); };
  const [sampleFaceBlurEnabled, setSampleFaceBlurEnabled] = useState(prompt?.sampleFaceBlurEnabled ?? true);
  const [sampleFaceBlurStrength, setSampleFaceBlurStrength] = useState(String(prompt?.sampleFaceBlurStrength ?? 100));
  const [sampleImageValue, setSampleImageValue] = useState(
    initialSampleOutput.type === "image" ? initialSampleOutput.value : ""
  );
  const [samplePreviews, setSamplePreviews] = useState(null);
  const initialCategories = getPromptCategories(prompt);
  const categories = initialCategories;
  const [sampleOutputType, setSampleOutputType] = useState(initialSampleOutput.type);
  const [sampleOutputMode, setSampleOutputMode] = useState(
    SAMPLE_OUTPUT_URL_TYPES.includes(initialSampleOutput.type) && initialSampleOutput.value
      ? "direct-url"
      : "upload"
  );
  const strength = Number(sampleFaceBlurStrength);
  const blurSettings = {
    ...(mode === "create" || sampleFaceBlurEnabled !== (prompt?.sampleFaceBlurEnabled ?? true)
      ? { sampleFaceBlurEnabled } : {}),
    ...(mode === "create" || strength !== (prompt?.sampleFaceBlurStrength ?? 100)
      ? { sampleFaceBlurStrength: strength } : {}),
  };
  const validBlurStrength = Number.isInteger(strength) && strength >= 1 && strength <= 2000;
  const singleImage = sampleImageValue === initialSampleOutput.value
    ? initialSampleOutput
    : { value: sampleImageValue };
  const previewImages = gallery.images.length ? gallery.images : sampleImageValue ? [singleImage] : [];
  const previewRequest = sampleOutputType === "image" && previewImages.length && validBlurStrength
    ? JSON.stringify({
        sampleFaceBlurEnabled,
        sampleFaceBlurStrength: strength,
        images: previewImages.map(({ value, provider, publicId, resourceType, format, fileName }) =>
          ({ value, provider, publicId, resourceType, format, fileName })
        ),
      })
    : "";
  const previewUrls = samplePreviews?.request === previewRequest ? samplePreviews.urls : [];
  const initialPreviewUrl = sampleOutputType === "video" && initialSampleOutput.type === "video"
    ? initialSampleOutput.watermarkedPreviewUrl || initialSampleOutput.value
    : sampleOutputType === "image" && !gallery.images.length ? previewUrls[0] : "";

  useEffect(() => {
    if (!previewRequest) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/prompts/sample-previews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: previewRequest,
          signal: controller.signal,
        });
        if (response.ok) {
          const { urls } = await response.json();
          if (!controller.signal.aborted) setSamplePreviews({ request: previewRequest, urls });
        }
      } catch {
        // A preview request can be retried by changing a setting or image.
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [previewRequest]);

  const [isFeatured, setIsFeatured] = useState(Boolean(prompt?.isFeatured));
  const [pricingType, setPricingType] = useState(() => getInitialPricingType(prompt));
  const [directPurchaseEnabled, setDirectPurchaseEnabled] = useState(
    prompt?.directPurchaseEnabled !== false && prompt?.isPurchasable !== false
  );
  const [creditUnlockEnabled, setCreditUnlockEnabled] = useState(
    Boolean(prompt?.creditUnlockEnabled)
  );
  const [regionalPriceRows, setRegionalPriceRows] = useState(() =>
    getInitialRegionalPrices(prompt?.regionalPrices)
  );
  const [fxRates, setFxRates] = useState({});
  const [fxRateDate, setFxRateDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const regionalPriceCurrenciesKey = getRegionalPriceCurrencies(regionalPriceRows).join(",");
  const monetizationDisabled = pricingType !== "premium";

  useEffect(() => {
    const currencies = regionalPriceCurrenciesKey
      ? regionalPriceCurrenciesKey.split(",").filter(Boolean)
      : [];

    if (!currencies.length) {
      setFxRateDate("");
      return;
    }

    let active = true;

    async function fetchFxRates() {
      const nextRates = {};
      let nextDate = "";

      await Promise.all(
        currencies.map(async (currency) => {
          try {
            const response = await fetch(
              `https://api.frankfurter.dev/v2/rate/${currency.toLowerCase()}/inr`,
              { cache: "force-cache" }
            );

            if (!response.ok) {
              return;
            }

            const data = await response.json();

            if (Number.isFinite(Number(data?.rate))) {
              nextRates[currency] = {
                rate: Number(data.rate),
                date: data.date || ""
              };
              nextDate = nextDate || data.date || "";
            }
          } catch {
            // Keep the pricing editor usable if the public FX helper is unavailable.
          }
        })
      );

      if (active) {
        setFxRates((currentRates) => ({ ...currentRates, ...nextRates }));
        setFxRateDate(nextDate);
      }
    }

    fetchFxRates();

    return () => {
      active = false;
    };
  }, [regionalPriceCurrenciesKey]);

  function updateRegionalPriceRow(rowId, field, value) {
    setPricingDirty(true); setDirty(true);
    setRegionalPriceRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        if (field === "region") {
          const nextRegion = String(value || "").toUpperCase();

          if (getUsedRegions(currentRows, rowId).has(nextRegion)) {
            return row;
          }

          return {
            ...row,
            region: nextRegion,
            currency: getCurrencyForRegion(nextRegion, row.currency)
          };
        }

        return {
          ...row,
          [field]: value
        };
      })
    );
  }

  function addRegionalPriceRow() {
    setPricingDirty(true); setDirty(true);
    setRegionalPriceRows((currentRows) => {
      const nextRegion = getNextAvailableRegion(currentRows);

      if (!nextRegion) {
        return currentRows;
      }

      return [
        ...currentRows,
        {
          id: `new-${Date.now()}`,
          region: nextRegion.value,
          currency: getCurrencyForRegion(nextRegion.value),
          amount: 0,
          isActive: false
        }
      ];
    });
  }

  function removeRegionalPriceRow(rowId) {
    setPricingDirty(true); setDirty(true);
    setRegionalPriceRows((currentRows) =>
      currentRows.length > 1 ? currentRows.filter((row) => row.id !== rowId) : currentRows
    );
  }

  function buildRegionalPricesPayload() {
    return regionalPriceRows.map((row) => ({
      region: String(row.region || "").trim().toUpperCase(),
      currency: getCurrencyForRegion(row.region, row.currency),
      amount: Number(row.amount || 0),
      isActive: Boolean(row.isActive)
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (galleryBusy) { setError("Wait for the gallery uploads to finish."); setLoading(false); return; }
    if (!taxonomy?.categoryId) { setError("Select a main category."); setLoading(false); return; }
    const formData = new FormData(event.currentTarget);
    const sampleOutputFile = getFileFromFormData(formData, "sampleOutputFile");
    const sampleOutputType = String(formData.get("sampleOutputType") || "text");
    const sampleOutputUrl = String(formData.get("sampleOutputUrl") || "").trim();
    const sampleOutputFileName = String(formData.get("sampleOutputFileName") || "").trim();
    if (sampleOutputType === "image" && galleryDirty && gallery.mode === "per-image" && (!gallery.images.length || gallery.images.some(image => !image.instructions?.trim()))) { setError("Add instructions for each sample image in the prompt set."); setLoading(false); return; }
    const featuredOrderValue = String(formData.get("featuredOrder") || "").trim();
    const featuredOrder =
      featuredOrderValue === "" ? undefined : Number(featuredOrderValue);
    const safeCreditUnlockEnabled = pricingType === "premium" && creditUnlockEnabled;
    const safeDirectPurchaseEnabled = pricingType === "premium" && directPurchaseEnabled;
    const creditCost = pricingType === "premium" ? Number(formData.get("creditCost") || 0) : 0;
    const regionalPrices = isExternal ? [] :
      pricingType === "premium"
        ? buildRegionalPricesPayload()
        : buildRegionalPricesPayload().map((priceRow) => ({
            ...priceRow,
            isActive: false
          }));
    const duplicateRegion = findDuplicateRegion(regionalPrices);

    if (duplicateRegion) {
      setError(`${getRegionLabel(duplicateRegion)} is already added. Each region can be used only once.`);
      setLoading(false);
      return;
    }
    const sampleOutputMetadata = {
      provider: String(formData.get("sampleOutputProvider") || "").trim(),
      publicId: String(formData.get("sampleOutputPublicId") || "").trim(),
      resourceType: String(formData.get("sampleOutputResourceType") || "").trim(),
      format: String(formData.get("sampleOutputFormat") || "").trim(),
      bytes: Number(formData.get("sampleOutputBytes") || 0) || undefined
    };
    const selectedCategories = normalizeCategories([
      ...normalizeCategoryInput(formData.get("categories") || "[]")
    ]);
    const payload = {
      listing: isExternal ? {
        listingType,
        externalType: String(formData.get("externalType")),
        redirectUrl: String(formData.get("redirectUrl")).trim(),
        license: String(formData.get("license")).trim(),
        priceBadge,
        ...(priceBadge === "paid" ? {
          externalPrice: Number(formData.get("externalPrice")),
          externalCurrency: String(formData.get("externalCurrency"))
        } : {})
      } : {},
      listingType,
      title: String(formData.get("title") || "").trim(),
      slug: String(formData.get("slug") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      seoTitle: String(formData.get("seoTitle") || "").trim(),
      seoDescription: String(formData.get("seoDescription") || "").trim(),
      shareImage: String(formData.get("shareImage") || "").trim(),
      shareImageAlt: String(formData.get("shareImageAlt") || "").trim(),
      tips: String(formData.get("tips") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
      image: String(formData.get("image") || "").trim(),
      thumbnail: String(formData.get("thumbnail") || "").trim(),
      category: selectedCategories[0] || String(formData.get("category") || "").trim(),
      categories: selectedCategories,
      tags: normalizeList(formData.get("tags") || ""),
      tools: normalizeList(formData.get("tools") || ""),
      prompt: String(formData.get("prompt") || "").trim(),
      sampleOutputType,
      sampleOutputUrl,
      sampleOutputFileName,
      sampleOutput: {
        type: sampleOutputType,
        value: String(formData.get("sampleOutputText") || "").trim(),
        fileName: sampleOutputFileName,
        ...sampleOutputMetadata
      },
      visibility: String(formData.get("visibility") || "public"),
      status: String(formData.get("status") || "published"),
      pricingType: isExternal ? "free" : pricingType,
      price: 0,
      isPurchasable: safeDirectPurchaseEnabled,
      creditUnlockEnabled: safeCreditUnlockEnabled,
      directPurchaseEnabled: safeDirectPurchaseEnabled,
      creditCost,
      regionalPrices,
      isFeatured,
      featuredOrder
    };

    const validationError = validBlurStrength
      ? validatePrompt(payload, sampleOutputFile, preservePricing)
      : "Blur strength must be an integer from 1 to 2000.";

    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const endpoint =
      mode === "create" ? "/api/admin/prompts" : `/api/admin/prompts/${prompt._id || prompt.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const requestOptions = sampleOutputFile
      ? {
          method,
          body: buildMultipartPayload(payload, sampleOutputFile)
        }
      : {
          method,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(buildJsonPayload(payload))
        };

    let response;

    try {
      response = await fetch(endpoint, requestOptions);
    } catch {
      setError("Unable to save prompt. Please check your connection and try again.");
      setLoading(false);
      return;
    }

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (result.details?.length) {
        setError(
          result.details
            .map((item) => (typeof item === "string" ? item : item.message))
            .filter(Boolean)
            .join(" ")
        );
      } else {
        setError(result.error || result.message || "Unable to save prompt.");
      }
      setLoading(false);
      return;
    }

    setDirty(false);
    router.push("/admin/prompts");
    router.refresh();
  }

  function buildJsonPayload(payload) {
    const jsonPayload = {
      ...taxonomy,
      ...blurSettings,
      ...payload.listing,
      title: payload.title,
      slug: payload.slug,
      description: payload.description,
      seoTitle: payload.seoTitle,
      seoDescription: payload.seoDescription,
      shareImage: payload.shareImage,
      shareImageAlt: payload.shareImageAlt,
      tips: payload.tips,
      notes: payload.notes,
      image: payload.image,
      thumbnail: payload.thumbnail,
      category: payload.category,
      categories: payload.categories,
      prompt: payload.prompt,
      tags: payload.tags,
      tools: payload.tools,
      visibility: payload.visibility,
      status: payload.status,
      pricingType: payload.pricingType,
      price: pricingType === "premium" && mode === "edit" ? Number(prompt?.price || 0) : 0,
      currency: prompt?.currency || "INR",
      isPurchasable: payload.isPurchasable,
      creditUnlockEnabled: payload.creditUnlockEnabled,
      directPurchaseEnabled: payload.directPurchaseEnabled,
      creditCost: payload.creditCost,
      regionalPrices: payload.regionalPrices,
      isFeatured: payload.isFeatured
    };

    if (galleryDirty || (sampleOutputType !== 'image' && prompt?.sampleImages?.length)) {
      jsonPayload.sampleImages = sampleOutputType === 'image' ? gallery.images : [];
      jsonPayload.sampleCoverId = sampleOutputType === 'image' ? gallery.coverId : '';
      jsonPayload.samplePromptMode = sampleOutputType === 'image' ? gallery.mode : 'single';
    }
    if (preservePricing) {
      jsonPayload.preservePricing = true;
      for (const field of PRICING_FIELDS) delete jsonPayload[field];
    }
    if (payload.featuredOrder !== undefined) {
      jsonPayload.featuredOrder = payload.featuredOrder;
    }

    if (payload.sampleOutputType === "text" && payload.sampleOutput.value) {
      jsonPayload.sampleOutput = payload.sampleOutput;
      jsonPayload.sampleOutputType = payload.sampleOutputType;
      jsonPayload.sampleOutputFileName = payload.sampleOutputFileName;
      return jsonPayload;
    }

    if (payload.sampleOutputUrl) {
      jsonPayload.sampleOutputUrl = payload.sampleOutputUrl;
      jsonPayload.sampleOutputType = payload.sampleOutputType;
      jsonPayload.sampleOutput = {
        ...payload.sampleOutput,
        value: payload.sampleOutputUrl
      };

      if (payload.sampleOutputFileName) {
        jsonPayload.sampleOutputFileName = payload.sampleOutputFileName;
      }
    }

    return jsonPayload;
  }

  function buildMultipartPayload(payload, sampleOutputFile) {
    const uploadFormData = new FormData();
    for (const [field, value] of Object.entries(payload.listing)) {
      uploadFormData.append(field, String(value));
    }
    for (const [field, value] of Object.entries(blurSettings)) {
      uploadFormData.append(field, String(value));
    }
    uploadFormData.append("categoryId", taxonomy.categoryId);
    uploadFormData.append("secondaryCategoryIds", JSON.stringify(taxonomy.secondaryCategoryIds || []));
    uploadFormData.append("tagIds", JSON.stringify(taxonomy.tagIds));
    uploadFormData.append("manualCollectionIds", JSON.stringify(taxonomy.manualCollectionIds));

    uploadFormData.append("title", payload.title);
    uploadFormData.append("slug", payload.slug);
    uploadFormData.append("description", payload.description);
    uploadFormData.append("seoTitle", payload.seoTitle);
    uploadFormData.append("seoDescription", payload.seoDescription);
    uploadFormData.append("shareImage", payload.shareImage);
    uploadFormData.append("shareImageAlt", payload.shareImageAlt);
    uploadFormData.append("tips", payload.tips);
    uploadFormData.append("notes", payload.notes);
    uploadFormData.append("image", payload.image);
    uploadFormData.append("thumbnail", payload.thumbnail);
    uploadFormData.append("category", payload.category);
    uploadFormData.append("categories", JSON.stringify(payload.categories));
    uploadFormData.append("prompt", payload.prompt);
    uploadFormData.append("tags", JSON.stringify(payload.tags));
    uploadFormData.append("tools", JSON.stringify(payload.tools));
    uploadFormData.append("visibility", payload.visibility);
    uploadFormData.append("status", payload.status);
    if (preservePricing) uploadFormData.append("preservePricing", "true");
    else {
      const pricingPayload = buildJsonPayload(payload);
      for (const field of PRICING_FIELDS) uploadFormData.append(field, typeof pricingPayload[field] === "object" ? JSON.stringify(pricingPayload[field]) : String(pricingPayload[field]));
    }
    uploadFormData.append("isFeatured", String(payload.isFeatured));
    if (payload.featuredOrder !== undefined) {
      uploadFormData.append("featuredOrder", String(payload.featuredOrder));
    }
    if (galleryDirty || (sampleOutputType !== 'image' && prompt?.sampleImages?.length)) {
      uploadFormData.append('sampleImages', JSON.stringify(sampleOutputType === 'image' ? gallery.images : []));
      uploadFormData.append('sampleCoverId', sampleOutputType === 'image' ? gallery.coverId : '');
      uploadFormData.append('samplePromptMode', sampleOutputType === 'image' ? gallery.mode : 'single');
    }
    uploadFormData.append("sampleOutputType", payload.sampleOutputType);
    uploadFormData.append("sampleOutputFileName", payload.sampleOutputFileName);
    uploadFormData.append("sampleOutputFile", sampleOutputFile);

    return uploadFormData;
  }

  return (
    <form className="panel form-card stack" onChange={() => setDirty(true)} onSubmit={handleSubmit}>
      <UnsavedWarning dirty={dirty} />
      <label className="field">
        Listing type
        <select value={listingType} disabled={mode === "edit"} onChange={event => setListingType(event.target.value)}>
          <option value="prompt">Prompt</option>
          <option value="external">External link</option>
        </select>
      </label>
      {isExternal && (
        <div className="form-grid">
          <label className="field">
            Type badge
            <select name="externalType" defaultValue={prompt?.externalType || "github"}>
              <option value="github">GitHub</option>
              <option value="template">Template</option>
              <option value="workflow">Workflow</option>
              <option value="resource">Resource</option>
            </select>
          </label>
          <label className="field">
            Destination URL
            <input name="redirectUrl" type="url" maxLength={2000} defaultValue={prompt?.redirectUrl} required />
          </label>
          <label className="field">
            License (optional)
            <input name="license" maxLength={80} defaultValue={prompt?.license} />
          </label>
          <label className="field">
            Price badge
            <select value={priceBadge} onChange={event => setPriceBadge(event.target.value)}>
              <option value="hidden">Hidden</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          {priceBadge === "paid" && <>
            <label className="field">
              External price
              <input name="externalPrice" type="number" min="0.01" max="100000000" step="0.01" defaultValue={prompt?.externalPrice} required />
            </label>
            <label className="field">
              Currency
              <select name="externalCurrency" defaultValue={prompt?.externalCurrency || "INR"}>
                {["INR", "USD", "GBP", "EUR", "NZD"].map(currency => <option key={currency}>{currency}</option>)}
              </select>
            </label>
          </>}
        </div>
      )}
      <AdminPromptTaxonomy prompt={prompt} onChange={handleTaxonomyChange} />
      <input name="categories" type="hidden" readOnly value={JSON.stringify(categories)} />
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          defaultValue={prompt?.title || ""}
          id="title"
          maxLength={120}
          minLength={3}
          name="title"
          onChange={(event) => {
            if (mode !== "create" || slugEditedRef.current) {
              return;
            }

            event.currentTarget.form.elements.slug.value = slugify(event.target.value);
          }}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="slug">Slug</label>
        <input
          defaultValue={prompt?.slug || ""}
          id="slug"
          name="slug"
          onChange={() => {
            slugEditedRef.current = true;
          }}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="launch-plan-generator"
          required
        />
        <span className="field-hint muted">
          Lowercase letters, numbers, and hyphens. Must be unique.
        </span>
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          defaultValue={prompt?.description || ""}
          id="description"
          maxLength={1000}
          name="description"
          placeholder="Short public summary for prompt cards and detail pages."
        />
        <span className="field-hint muted">Shown publicly. Up to 1,000 characters.</span>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="seoTitle">SEO title optional</label>
          <input
            defaultValue={prompt?.seoTitle || ""}
            id="seoTitle"
            maxLength={70}
            name="seoTitle"
            placeholder={prompt?.title || "Prompt title"}
          />
          <span className="field-hint muted">Defaults to the prompt title.</span>
        </div>
        <div className="field">
          <label htmlFor="seoDescription">SEO description optional</label>
          <textarea
            defaultValue={prompt?.seoDescription || ""}
            id="seoDescription"
            maxLength={180}
            name="seoDescription"
            placeholder={prompt?.description || "Short public summary for social previews."}
          />
          <span className="field-hint muted">Defaults to the public description.</span>
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="shareImage">Sharing image optional</label>
          <input
            defaultValue={prompt?.shareImage || ""}
            id="shareImage"
            name="shareImage"
            placeholder="https://example.com/social-preview.jpg"
            type="url"
          />
          <span className="field-hint muted">
            Defaults to the image sample or video poster when available.
          </span>
        </div>
        <div className="field">
          <label htmlFor="shareImageAlt">Sharing image alt text optional</label>
          <input
            defaultValue={prompt?.shareImageAlt || ""}
            id="shareImageAlt"
            maxLength={180}
            name="shareImageAlt"
            placeholder={`${prompt?.title || "Prompt"} sample output`}
          />
          <span className="field-hint muted">Defaults to the prompt title and sample output.</span>
        </div>
      </div>
      <div className="field">
        <label className="field-label-with-icon" htmlFor="tips">
          <Lightbulb aria-hidden="true" size={16} />
          Tips
        </label>
        <textarea
          defaultValue={prompt?.tips || prompt?.notes || ""}
          id="tips"
          maxLength={5000}
          name="tips"
          placeholder="Helpful tips, usage notes, or extra context for customers."
        />
        <span className="field-hint muted">Shown on the public prompt page. Up to 5,000 characters.</span>
      </div>
      <div className="field">
        <label htmlFor="notes">Internal notes</label>
        <textarea
          defaultValue={prompt?.notes || ""}
          id="notes"
          maxLength={5000}
          name="notes"
          placeholder="Private admin notes or migration context."
        />
        <span className="field-hint muted">Saved with the prompt record for admin use.</span>
      </div>
      {!isExternal && <div className="field">
        <label htmlFor="prompt">Prompt</label>
        <textarea
          defaultValue={prompt?.prompt || ""}
          id="prompt"
          maxLength={10000}
          minLength={10}
          name="prompt"
          required
        />
      </div>}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="image">Image URL</label>
          <input
            defaultValue={prompt?.image || ""}
            id="image"
            name="image"
            placeholder="https://example.com/prompt-image.png"
            type="url"
          />
          <span className="field-hint muted">Used for public previews and SEO when available.</span>
        </div>
        <div className="field">
          <label htmlFor="thumbnail">Thumbnail URL</label>
          <input
            defaultValue={prompt?.thumbnail || ""}
            id="thumbnail"
            name="thumbnail"
            placeholder="https://example.com/prompt-thumbnail.png"
            type="url"
          />
        </div>
      </div>
      <div className="sample-output-fields">
        <label className="checkbox-field">
          <input
            type="checkbox"
            role="switch"
            checked={sampleFaceBlurEnabled}
            onChange={event => {
              if (!event.target.checked && !validBlurStrength) {
                setSampleFaceBlurStrength(String(prompt?.sampleFaceBlurStrength ?? 100));
              }
              setSampleFaceBlurEnabled(event.target.checked);
            }}
          />
          Blur faces in sample images
        </label>
        <label className="field">
          Blur strength
          <input
            type="number"
            min={1}
            max={2000}
            step={1}
            required
            disabled={!sampleFaceBlurEnabled}
            value={sampleFaceBlurStrength}
            onChange={event => setSampleFaceBlurStrength(event.target.value)}
          />
        </label>
        <input name="sampleOutputProvider" readOnly type="hidden" value={initialSampleOutput.provider} />
        <input name="sampleOutputPublicId" readOnly type="hidden" value={initialSampleOutput.publicId} />
        <input name="sampleOutputResourceType" readOnly type="hidden" value={initialSampleOutput.resourceType} />
        <input name="sampleOutputFormat" readOnly type="hidden" value={initialSampleOutput.format} />
        <input name="sampleOutputBytes" readOnly type="hidden" value={initialSampleOutput.bytes} />
        {initialPreviewUrl ? (
          <div className="field admin-sample-preview">
            <label>Public sample preview</label>
            <div className="sample-media-box">
              {initialSampleOutput.type === "video" ? (
                <video
                  className="sample-output-video"
                  controls
                  preload="metadata"
                  src={initialPreviewUrl}
                />
              ) : (
                <img
                  alt={
                    initialSampleOutput.fileName ||
                    `${prompt?.title || "Prompt"} public sample preview`
                  }
                  className="sample-output-image"
                  src={initialPreviewUrl}
                />
              )}
            </div>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="sampleOutputType">Sample output type</label>
          <select
            id="sampleOutputType"
            name="sampleOutputType"
            onChange={(event) => {
              const nextType = event.target.value;
              setSampleOutputType(nextType);

              if (nextType !== "text" && sampleOutputType === "text") {
                setSampleOutputMode(
                  SAMPLE_OUTPUT_URL_TYPES.includes(initialSampleOutput.type) &&
                    initialSampleOutput.value
                    ? "direct-url"
                    : "upload"
                );
              }
            }}
            value={sampleOutputType}
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="file">File</option>
          </select>
        </div>

        {sampleOutputType === 'image' ? <AdminSampleGallery value={gallery} onChange={handleGalleryChange} onBusyChange={setGalleryBusy} legacySample={initialSampleOutput} previewUrls={previewUrls} /> : null}
        {sampleOutputType === "text" ? (
          <div className="field">
            <label htmlFor="sampleOutputValue">Sample output text</label>
            <textarea
              defaultValue={initialSampleOutput.type === "text" ? initialSampleOutput.value : ""}
              id="sampleOutputValue"
              key="sampleOutput-text"
              maxLength={10000}
              name="sampleOutputText"
              placeholder="Paste the sample response text..."
            />
          </div>
        ) : sampleOutputType === "image" && gallery.images.length ? <p className="field-hint">The selected gallery cover is used as the sample image. Remove all gallery images to edit a single sample instead.</p> : (
          <>
            <div className="field">
              <label htmlFor="sampleOutputMode">Sample output source</label>
              <select
                id="sampleOutputMode"
                onChange={(event) => setSampleOutputMode(event.target.value)}
                value={sampleOutputMode}
              >
                <option value="upload">Upload file</option>
                <option value="direct-url">Direct URL</option>
              </select>
            </div>

            {sampleOutputMode === "upload" ? (
              <div className="field">
                <label htmlFor="sampleOutputFile">Sample output file optional</label>
                <input
                  accept={
                    sampleOutputType === "image"
                      ? "image/*"
                      : sampleOutputType === "video"
                        ? "video/mp4,video/webm,video/quicktime,video/*"
                      : sampleOutputType === "pdf"
                        ? "application/pdf"
                        : undefined
                  }
                  id="sampleOutputFile"
                  key={`${sampleOutputType}-file`}
                  name="sampleOutputFile"
                  type="file"
                />
                <span className="field-hint muted">Uploads up to 10 MB.</span>
              </div>
            ) : (
              <div className="field">
                <label htmlFor="sampleOutputUrl">
                  {sampleOutputType === "image"
                    ? "Image URL"
                    : sampleOutputType === "video"
                      ? "Video URL"
                    : sampleOutputType === "pdf"
                      ? "PDF URL"
                      : "File URL"}
                </label>
                <input
                  defaultValue={
                    sampleOutputType === "image" ? sampleImageValue
                      : initialSampleOutput.type === sampleOutputType ? initialSampleOutput.value : ""
                  }
                  id="sampleOutputUrl"
                  key={`${sampleOutputType}-value`}
                  name="sampleOutputUrl"
                  onChange={event => {
                    if (sampleOutputType === "image") setSampleImageValue(event.target.value.trim());
                  }}
                  placeholder={
                    sampleOutputType === "image"
                      ? "https://example.com/sample-output.png"
                      : sampleOutputType === "video"
                        ? "https://example.com/sample-output.mp4"
                      : sampleOutputType === "pdf"
                        ? "https://example.com/sample-output.pdf"
                        : "https://example.com/sample-output.zip"
                  }
                  type="url"
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="sampleOutputFileName">File name optional</label>
              <input
                defaultValue={
                  initialSampleOutput.type === sampleOutputType
                    ? initialSampleOutput.fileName
                    : ""
                }
                id="sampleOutputFileName"
                key={`${sampleOutputType}-fileName`}
                name="sampleOutputFileName"
                placeholder={
                  sampleOutputType === "image"
                    ? "sample-output.png"
                    : sampleOutputType === "video"
                      ? "sample-output.mp4"
                    : sampleOutputType === "pdf"
                      ? "sample-output.pdf"
                      : "sample-output.zip"
                }
              />
            </div>
          </>
        )}
      </div>
      <div className="field">
        <label htmlFor="tools">Tools</label>
        <input
          defaultValue={(prompt?.tools || []).join(", ")}
          id="tools"
          name="tools"
          placeholder="ChatGPT, Canva, Notion"
        />
      </div>

      {!isExternal && <section className="pricing-editor-section" aria-label="Prompt pricing" onChange={() => { setPricingDirty(true); setDirty(true); }}>
        <div className="pricing-editor-heading">
          <div>
            <h2>Pricing</h2>
            <p className="muted">Choose whether this prompt is free or unlockable through credits and regional checkout.</p>
          </div>
          <div className="pricing-radio-group" role="radiogroup" aria-label="Pricing">
            <label className="admin-checkbox" htmlFor="pricingTypeFree">
              <input
                checked={pricingType === "free"}
                id="pricingTypeFree"
                name="pricingType"
                onChange={() => setPricingType("free")}
                type="radio"
                value="free"
              />
              Free
            </label>
            <label className="admin-checkbox" htmlFor="pricingTypePremium">
              <input
                checked={pricingType === "premium"}
                id="pricingTypePremium"
                name="pricingType"
                onChange={() => setPricingType("premium")}
                type="radio"
                value="premium"
              />
              Premium
            </label>
          </div>
        </div>

        <div className="pricing-editor-controls">
          <label className="admin-checkbox" htmlFor="directPurchaseEnabled">
            <input
              checked={pricingType === "premium" && directPurchaseEnabled}
              disabled={monetizationDisabled}
              id="directPurchaseEnabled"
              name="directPurchaseEnabled"
              onChange={(event) => setDirectPurchaseEnabled(event.target.checked)}
              type="checkbox"
            />
            Direct purchase
          </label>
          <label className="admin-checkbox" htmlFor="creditUnlockEnabled">
            <input
              checked={pricingType === "premium" && creditUnlockEnabled}
              disabled={monetizationDisabled}
              id="creditUnlockEnabled"
              name="creditUnlockEnabled"
              onChange={(event) => setCreditUnlockEnabled(event.target.checked)}
              type="checkbox"
            />
            Credit unlock
          </label>
          <div className="field pricing-credit-field">
            <label htmlFor="creditCost">Credit cost</label>
            <input
              defaultValue={prompt?.creditCost || 0}
              id="creditCost"
              disabled={monetizationDisabled || !creditUnlockEnabled}
              min="0"
              name="creditCost"
              step="1"
              type="number"
            />
          </div>
        </div>

        <div className="field pricing-region-field">
          <div className="pricing-table-title-row">
            <label>Regional prices</label>
            <span className="field-hint muted">Region controls currency automatically.</span>
          </div>
          <div className="regional-prices-table-wrap">
            <table className="regional-prices-table">
              <thead>
                <tr>
                  <th>Active</th>
	                  <th>Region</th>
	                  <th>Currency</th>
	                  <th>Amount</th>
	                  <th>INR approx</th>
	                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {regionalPriceRows.map((row) => (
                  <tr key={row.id}>
                    <td>
	                      <input
	                        aria-label={`Activate ${row.region || "regional"} price`}
	                        checked={Boolean(row.isActive)}
	                        disabled={monetizationDisabled}
	                        onChange={(event) =>
	                          updateRegionalPriceRow(row.id, "isActive", event.target.checked)
                        }
                        type="checkbox"
                      />
                    </td>
	                    <td>
		                      <select
		                        aria-label="Pricing region"
		                        disabled={monetizationDisabled}
	                        onChange={(event) =>
                          updateRegionalPriceRow(row.id, "region", event.target.value)
                        }
	                        value={row.region}
	                      >
	                        {PRICING_REGION_OPTIONS.map((option) => (
	                          <option
	                            disabled={getUsedRegions(regionalPriceRows, row.id).has(option.value)}
	                            key={option.value}
	                            value={option.value}
	                          >
	                            {option.label}
	                          </option>
	                        ))}
                      </select>
                    </td>
                    <td>
			                      <select
			                        aria-label="Pricing currency"
			                        disabled={monetizationDisabled || row.region !== "DEFAULT"}
                        onChange={(event) =>
                          updateRegionalPriceRow(row.id, "currency", event.target.value)
                        }
		                        value={row.currency}
		                      >
	                        {CURRENCY_OPTIONS.map((currencyOption) => (
                          <option key={currencyOption} value={currencyOption}>
                            {currencyOption}
                          </option>
                        ))}
	                      </select>
                    </td>
	                    <td>
	                      <input
	                        aria-label="Pricing amount"
	                        disabled={monetizationDisabled}
	                        min="0"
                        onChange={(event) =>
                          updateRegionalPriceRow(row.id, "amount", event.target.value)
                        }
                        step="0.01"
                        type="number"
	                        value={row.amount}
	                      />
	                    </td>
	                    <td className="regional-price-conversion">
	                      {formatInrApproximation(row, fxRates)}
	                    </td>
	                    <td>
                      <button
                        aria-label={`Remove ${row.region || "regional"} price`}
	                        className="button-icon"
	                        disabled={monetizationDisabled || regionalPriceRows.length <= 1}
                        onClick={() => removeRegionalPriceRow(row.id)}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="button-secondary compact"
            disabled={monetizationDisabled || !getNextAvailableRegion(regionalPriceRows)}
            onClick={addRegionalPriceRow}
            type="button"
          >
            <Plus aria-hidden="true" size={16} />
            Add region
          </button>
          <span className="field-hint muted">
            Enter normal amounts, for example INR 10 as 10 and USD 0.55 as 0.55.
            Only active rows are used for checkout. INR conversion is an approximate daily reference
            {fxRateDate ? ` from ${fxRateDate}` : ""}.
          </span>
        </div>
      </section>}
      <div className="toolbar">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="status">Status</label>
          <select defaultValue={prompt?.status || "published"} id="status" name="status">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="visibility">Visibility</label>
          <select
            defaultValue={prompt?.visibility || "public"}
            id="visibility"
            name="visibility"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>
      <div className="featured-fieldset">
        <label className="admin-checkbox" htmlFor="isFeatured">
          <input
            checked={isFeatured}
            id="isFeatured"
            name="isFeatured"
            onChange={(event) => setIsFeatured(event.target.checked)}
            type="checkbox"
          />
          Featured on homepage
        </label>
        {isFeatured ? (
          <div className="field">
            <label htmlFor="featuredOrder">Featured order</label>
            <input
              defaultValue={
                prompt?.featuredOrder === undefined || prompt?.featuredOrder === null
                  ? ""
                  : prompt.featuredOrder
              }
              id="featuredOrder"
              min="0"
              name="featuredOrder"
              placeholder="0"
              type="number"
            />
            <span className="field-hint muted">
              Optional. Lower numbers appear earlier when the backend sorts featured prompts.
            </span>
          </div>
        ) : null}
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <button className="button" disabled={loading || galleryBusy} type="submit">
        {loading ? "Saving..." : mode === "create" ? "Create Prompt" : "Update Prompt"}
      </button>
    </form>
  );
}
