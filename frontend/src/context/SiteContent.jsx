import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const U = "https://images.unsplash.com";
const G = "?crop=entropy&cs=srgb&fm=jpg&q=85";

export const DEFAULT_CONTENT = {
  hero_line1: "The Home of",
  hero_line2_gold: "Pathankot",
  hero_line2_rest: "Cricket",
  hero_subline:
    "The official cricketing body of District Pathankot, affiliated to the Punjab Cricket Association, Mohali — conducting trials, selecting players and fielding squads from U-14 to Seniors, for men and women, into inter-district competition.",
  hero_image: `${U}/photo-1759733845137-5eb942436f49${G}`,
  about_heading: "One body for the game in Pathankot.",
  about_p1:
    "The Cricket Association Pathankot (CAP) is the official cricketing body for District Pathankot, affiliated to the Punjab Cricket Association (PCA), Mohali.",
  about_p2:
    "From identifying talent at open trials to formalising squads after selection, the Association administers every stage of the district game — conducting selections, making teams, and sending Pathankot's sides to inter-district competition.",
  about_image: `${U}/photo-1593341646782-e0b495cff86d${G}`,
  about_points: [
    "Official body for District Pathankot",
    "Affiliated to PCA, Mohali",
    "Trials & merit-based selections",
    "Squads from U-14 to Seniors — Men & Women",
  ],
  trials_label: "District Trials · All Age Groups",
  trials_heading: "Open trials for U-14 to Seniors — men & women.",
  trials_dates: "To be Announced Soon",
  teams_heading: "Nine squads. Two wings.",
  teams_accent: "One district.",
  teams_sub:
    "Selections are held for every category, for men and women alike. Registered players are called to trials as squads are formalised.",
  process_heading: "From trials to the district cap.",
  process_steps: [
    { title: "Open Trials", desc: "Trials for each age group are announced by the Association, open to eligible players from across District Pathankot." },
    { title: "Merit Selection", desc: "Selectors assess skill, form and match temperament. Selections are made on merit — for both men's and women's wings." },
    { title: "Squad Formation", desc: "Selected players are formalised into official district squads — the Pathankot teams for the season." },
    { title: "Inter-District", desc: "Squads carry the district colours into inter-district matches under the Punjab Cricket Association." },
  ],
  gallery_heading: "District cricket, in pictures.",
  gallery_urls: [
    `${U}/photo-1565787154274-c8d076ad34e7${G}`,
    `${U}/photo-1593766827228-8737b4534aa6${G}`,
    `${U}/photo-1595210382051-4d2c31fcc2f4${G}`,
    `${U}/photo-1624193757636-b829dfa06a1b${G}`,
    `${U}/photo-1729027696167-0f3aa8e92e64${G}`,
    `${U}/photo-1595210382266-2d0077c1f541${G}`,
  ],
  contact_address: "Jodhamal Colony, Pathankot",
  contact_phone: "89680-44334",
  contact_email: "cricketpathankot@gmail.com",
  footer_tagline:
    "The official cricketing body of District Pathankot, affiliated to the Punjab Cricket Association, Mohali.",
  bearers: [
    { role: "President", name: "Sh. Balbir Manhas" },
    { role: "Sr. Vice President", name: "Sh. Satish Mahendru" },
    { role: "Vice President", name: "Sh. Varun Thakur" },
    { role: "Secretary", name: "Sh. Sunny Mahajan" },
    { role: "Joint Secretary", name: "Sh. Prashant Sharma" },
  ],
};

const SiteContentContext = createContext(DEFAULT_CONTENT);

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(DEFAULT_CONTENT);

  useEffect(() => {
    api
      .get("/content")
      .then(({ data }) => setContent({ ...DEFAULT_CONTENT, ...(data || {}) }))
      .catch(() => {});
  }, []);

  return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>;
}

export const useSiteContent = () => useContext(SiteContentContext);
