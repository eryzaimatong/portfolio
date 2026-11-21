/* Custom line glyphs (24 x 24, drawn as strokes) for skills that have no official open-source icon.
   They describe the skill generically and deliberately do not imitate any company's logo. */
export const GLYPHS: Record<string, string> = {
  SQL: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  COBOL: "M5 3h11l3 3v15H5z M8 8h1.5 M11 8h1.5 M14 8h1.5 M8 12h1.5 M12 12h1.5 M15 12h1 M9 16h1.5 M13 16h1.5",
  Excel: "M4 4h16v16H4z M4 9h16 M4 14h16 M9 4v16 M14 4v16",
  "Power BI": "M5 20v-8 M10 20V7 M15 20v-10 M20 20V4 M3 20h18",
  "Data cleaning": "M3 4h18l-7 8v6l-4 2v-8z",
  "Exploratory data analysis": "M10.5 17a6.5 6.5 0 1 0 0-13a6.5 6.5 0 0 0 0 13z M15.5 15.5L21 21 M7.5 12l2-2 2 1.5 2.5-3",
  "Data visualization": "M3 3v18h18 M7 15l4-5 3 3 5-7",
  "Machine learning": "M4 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M4 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M10 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M16 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M16 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M7.5 7.4l3 3.2 M7.5 16.6l3-3.2 M13.8 11.2l2.4-2.6 M13.8 12.8l2.4 2.6",
  "Statistical analysis": "M3 19h18 M4 19c3 0 4-13 8-13s5 13 8 13 M12 6v13",
  "REST APIs": "M8 4c-2 0-3 1-3 3v2c0 1-1 2-2 2c1 0 2 1 2 2v2c0 2 1 3 3 3 M16 4c2 0 3 1 3 3v2c0 1 1 2 2 2c-1 0-2 1-2 2v2c0 2-1 3-3 3 M9.5 12h5 M12.5 10l2 2-2 2",
  "Database design": "M3 4h7v6H3z M14 14h7v6h-7z M6.5 10v7h7.5",
  "Relational database management": "M3 5h7v14H3z M3 9h7 M3 13h7 M14 5h7v14h-7z M14 9h7 M14 13h7 M10 11h4",
  "VS Code": "M9 7l-5 5 5 5 M15 7l5 5-5 5 M13.5 5l-3 14",
  Workato: "M3 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M17 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M17 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M7 12c4 0 6-6 10-6 M7 12c4 0 6 6 10 6",
  ChatGPT: "M4 5h16v11H9l-5 4z M12 7.5v6 M9 10.5h6",
  "AI-assisted development": "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z M6 17l-2.5 2 2.5 2 M18 17l2.5 2-2.5 2",
  "Prompt engineering": "M3 4h18v16H3z M7 10l3 2-3 2 M12 15h5",
  Slack: "M9 3L7 21 M17 3l-2 18 M4 8.5h17 M3 15.5h17",
  "Microsoft Teams": "M9 11a3 3 0 1 0 0-6a3 3 0 0 0 0 6z M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M16.5 10a2.5 2.5 0 1 0 0-5 M16 14c2.8 0 5 2.2 5 5",
};
