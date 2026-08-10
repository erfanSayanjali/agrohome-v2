"use client";

import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import fa from "../locales/fa/translation.json";
import en from "../locales/en/translation.json";

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: {
      fa: { translation: fa },
      en: { translation: en },
    },
    lng: "fa", // مقدار پیش‌فرض
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export default i18next;
