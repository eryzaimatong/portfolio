/* Profile content, carried over verbatim from the existing portfolio. */
export const profile = {
  name: "Eryza Mae Imatong",
  kicker: "Data Science, Analytics & Developer",
  intro:
    "BSIT student at PUP Manila, specializing in Data Science. Looking for data science, analytics and technical internships. Based in Manila, Philippines.",
  availability: "Open to internships",
  availabilityNote: "Looking for data science, analytics and technical internships. Based in Manila, Philippines.",
  email: "imatongeryzamae@gmail.com",
  github: "https://github.com/eryzaimatong",
  linkedin: "https://www.linkedin.com/in/eryza-mae-imatong/",
  location: "Manila, Philippines",
  url: "https://eryza-mae-imatong.vercel.app",
  description:
    "BSIT (Data Science) student at PUP Manila and DOST-SEI merit scholar. Projects in recommendation systems, machine learning and software development. Looking for data science, analytics and technical internships.",
};

export const about = {
  heading: "Hello, I am Eryza",
  lead: "BSIT student at PUP Manila, specializing in Data Science, and a DOST-SEI merit scholar.",
  bio: [
    "I'm most interested in data science and analytics: working out what a dataset can honestly say, and how sure we can be about it. I also build software, so I can turn analysis into tools people use.",
    "In Re:Watch I built an explainable taste model; in AURA I trained a face-shape classifier and held it back from launch when it failed my own fairness check. I'm looking for data science, analytics and technical internships.",
  ],
  fields: [
    ["Program", "BS Information Technology, Data Science"],
    ["University", "Polytechnic University of the Philippines, Manila"],
    ["Scholarship", "DOST-SEI merit scholar"],
    ["Expected graduation", "2028"],
    ["Featured projects", "2"],
    ["Credentials", "4"],
  ] as [string, string][],
  photo: { src: "/assets/eryza.png", alt: "Portrait of Eryza Mae Imatong" },
};

export type Panel = {
  date: string; title: string; org?: string; detail: string;
  chips?: string[]; link?: { href: string; label: string }; titleHref?: string;
  badge?: { src: string; alt: string; light?: boolean; wide?: boolean; round?: boolean };
  orgKey?: string; cert?: { src: string; alt: string };
};

export const experience = {
  heading: "Where I Have Been",
  sub: "School, a scholarship, and a few programs that shaped how I work.",
  items: [
    { date: "2024 to 2028 (expected)", title: "BS Information Technology, Data Science", org: "Polytechnic University of the Philippines, Manila", detail: "Specializing in Data Science.", badge: { src: "/assets/seal-pup.png", alt: "PUP seal", round: true } },
    { date: "2024 to present", title: "Merit Scholar", org: "DOST-SEI (Department of Science and Technology)", detail: "Merit scholarship from the DOST Science Education Institute, 2024 cohort, supporting my BS degree.", badge: { src: "/assets/logo-dost-clean.png", alt: "DOST logo", round: true, light: true } },
    { date: "Sep to Dec 2026 · in progress", title: "Global Consumer Intelligence (GCI) program", titleHref: "https://weblab.t.u-tokyo.ac.jp/en/lecture/gci", org: "University of Tokyo, Matsuo-Iwasawa Lab (JICA-supported)", detail: "Online program: attend sessions, complete homework, join competitions and build a final project.", badge: { src: "/assets/logo-gci.png", alt: "Matsuo-Iwasawa Lab, University of Tokyo", wide: true, light: true } },
  ] as Panel[],
};

export const leadership = {
  label: "Leadership",
  heading: "Beyond the Code",
  sub: "Teams and communities I design for, build with, or help lead.",
  items: [
    { date: "Cisco NetConnect · PUP – Manila", title: "Graphic Designer, Creatives Department", detail: "Design event recap posts and other graphics for the organization's Facebook page.", chips: ["Visual design", "Figma"], orgKey: "cisco", badge: { src: "/assets/logo-netconnect.png", alt: "Cisco NetConnect logo", round: true } },
    { date: "IBITS · Institute of Bachelors in Information Technology Studies", title: "Logistics & Resource Operations Member", detail: "Member of the Program and Activities Department, working on logistics and resource operations.", chips: ["Logistics", "Event planning", "Resource management"], link: { href: "https://www.facebook.com/iBITS.Official", label: "IBITS on Facebook" }, badge: { src: "/assets/logo-ibits.png", alt: "IBITS logo", round: true } },
    { date: "Google Developer Groups on Campus · PUP · 2026–27", title: "Strategy and Insights Associate (Strategic Department)", detail: "Turning research and data into meaningful insights to guide organizational decisions, strategic planning, and performance evaluation.", chips: ["Data Analysis", "Strategic Planning", "Research"], badge: { src: "/assets/logo-gdg-pup.png", alt: "Google Developer Groups on Campus, Polytechnic University of the Philippines logo", round: true } },
    { date: "AWS Student Builder Group · PUP", title: "Program Manager, Programs Department", detail: "Program Manager in the Programs Department of the AWS Student Builder Group at the Polytechnic University of the Philippines.", badge: { src: "/assets/logo-aws-pup.png", alt: "AWS Student Builder Group, Polytechnic University of the Philippines logo", round: true } },
  ] as Panel[],
};

export const ciscoOrg = {
  org: "Cisco NetConnect · PUP – Manila",
  role: "Graphic Designer, Creatives Department",
  tiles: [
    { tag: "Social graphics", title: "Event recap posts", text: "Post-event graphics that recap each activity for the community on Facebook.", chips: ["Visual design", "Figma"], link: { label: "View a published post on Facebook", href: "https://www.facebook.com/share/p/1DscWrfCUx/" } },
    { tag: "Page graphics", title: "Designed to match each event", text: "Other graphics for the organization's page, built around each event's theme." },
  ],
};

export const credentials = {
  label: "Certification & training",
  heading: "Credentials",
  items: ([
    { date: "DataCamp certification · Aug 2026", title: "Associate Data Analyst", cert: { src: "/assets/cert-datacamp.png", alt: "DataCamp Associate Data Analyst certificate" }, badge: { src: "/assets/logo-datacamp.png", alt: "DataCamp", wide: true, light: true } },
    { date: "Cisco Networking Academy course · Aug 2026", title: "Data Analytics Essentials", cert: { src: "/assets/cert-cisco.png", alt: "Cisco Networking Academy Data Analytics Essentials certificate" }, badge: { src: "/assets/logo-cna.png", alt: "Cisco Networking Academy", wide: true, light: true } },
    { date: "DataCamp career track, 39 hours · Aug 2026", title: "Associate Data Analyst in SQL", cert: { src: "/assets/cert-sql.png", alt: "DataCamp Associate Data Analyst in SQL certificate" }, badge: { src: "/assets/logo-datacamp.png", alt: "DataCamp", wide: true, light: true } },
    { date: "DataCamp career track, 50 hours · Nov 2026", title: "Data Analyst in Power BI", cert: { src: "/assets/cert-powerbi.jpg", alt: "DataCamp Data Analyst in Power BI statement of accomplishment" }, badge: { src: "/assets/logo-datacamp.png", alt: "DataCamp", wide: true, light: true } },
  ]) as Panel[],
};

export const contact = {
  heading: "Let’s talk",
  lead: "I'm looking for data science, analytics and technical internships. If you're hiring, or want to talk about Re:Watch or AURA, email me. Based in Manila, Philippines.",
  footer: "Eryza Mae Imatong · Manila, Philippines",
};
