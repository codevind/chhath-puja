
export const SITE_CONFIG = {
  title: "माँ कमलेश्वरी छठ पूजा समिति",
  subtitle: "हरि घाट, पोखराम",

  upiId : "7654483661@ybl",
  payeeName: "Chhath Puja Samiti",
  donationNote: "Voluntary Chhath Puja contribution",

  templatePath: "/templates/badge.png",
  contributorsSheetUrl:
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR38f8FFhZydvHj_pJwDx7QTqHammreee1Q_9X2WYjVTNPu96xu6CBqOt5Kt4H3jBIQ3FEpVLXix5Jb/pub?gid=0&single=true&output=csv",

  // Circular photo position (percentage based)
  photo: {
    centerX: 49.3,
    centerY: 57.25,
    radius: 18.45,
  },

  // Name position below the photo
  name: {
    x: 49.3,
    y: 79.8,
    maxWidth: 43,
    fontSize: 3.2,
  },
} as const;
