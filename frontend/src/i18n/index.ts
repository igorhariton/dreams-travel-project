export { en } from "./en";
export { ro } from "./ro";
export { ru } from "./ru";

export const supportedLanguages = [
  {
    code: "en",
    label: "English",
    nativeLabel: "English",
    flag: "🇬🇧",
  },
  {
    code: "ro",
    label: "Romanian",
    nativeLabel: "Română",
    flag: "🇷🇴",
  },
  {
    code: "ru",
    label: "Russian",
    nativeLabel: "Русский",
    flag: "🇷🇺",
  },
] as const;

export { destinations, hotels, rentals } from "../app/data/travelData";
export {
  destinationDescriptionsI18n,
  destinationDescriptionsI18n as destinationDescriptions,
} from "../app/data/destinationDescriptions.i18n";
export {
  destinationDetailsI18n,
  destinationDetailsI18n as destinationDetailsContent,
} from "../app/data/destinationDetails.i18n";
export {
  hotelsContentI18n,
  hotelsContentI18n as hotelsContent,
} from "../app/data/hotelsContent.i18n";
export {
  rentalsContentI18n,
  rentalsContentI18n as rentalsContent,
} from "../app/data/rentalsContent.i18n";
