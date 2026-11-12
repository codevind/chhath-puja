/**
 * Update these values before publishing.
 * Replace the template asset with the Samiti's approved badge artwork.
 */
export const SITE_CONFIG = {
  title: "Chhath Puja Samiti",
  subtitle: "श्रद्धा • आस्था • समर्पण",
  upiId: "YOUR_UPI_ID@BANK",
  payeeName: "Chhath Puja Samiti",
  donationNote: "Voluntary Chhath Puja contribution",
  templatePath: "/templates/badge-template.svg",
  // Coordinates are percentages of the full template dimensions.
  // Adjust these once the final badge artwork is supplied.
  photo: { x: 34, y: 24, width: 32, height: 42 },
  name: { x: 50, y: 78, maxWidth: 82, fontSize: 5.2 }
} as const;
