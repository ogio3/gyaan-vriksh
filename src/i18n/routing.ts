import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "hi", "pa", "ja"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});
