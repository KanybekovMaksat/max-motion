import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { loadFont as oswald } from "@remotion/google-fonts/Oswald";
import { loadFont as playfair } from "@remotion/google-fonts/PlayfairDisplay";

const subsets: ("latin" | "cyrillic")[] = ["latin", "cyrillic"];

// UI text, captions, cards
export const SANS = inter("normal", { weights: ["400", "500", "600", "700", "800", "900"], subsets }).fontFamily;
// big condensed headline ("CLAUDE")
export const COND = oswald("normal", { weights: ["600", "700"], subsets }).fontFamily;
// the italic accent ("edited this?", "Personal")
export const SERIF = playfair("italic", { weights: ["500", "700", "900"], subsets }).fontFamily;
