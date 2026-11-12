
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import { Users } from "lucide-react";
import Contributors from "./components/Contributors";
import VisitCounter from "./components/VisitCounter";
import HeroSlideshow from "./components/HeroSlideshow";
import ChhathCountdown from "./components/ChhathCountdown";
import type { Contributor } from "./components/Contributors";
import AdminSection, { adminRequest } from "./components/AdminSection";
import { normalizeMobileNumber } from "./utils/mobileNumber";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Download,
  Heart,
  HeartHandshake,
  ImagePlus,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { SITE_CONFIG } from "./config";

type Page = "home" | "badge" | "donate"| "contributors";;

/* ============================================
   STYLED COMPONENTS
============================================ */

const Shell = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 0% 12%, #f7b53f20, transparent 42%),
    radial-gradient(ellipse at 100% 52%, #e86e2610, transparent 42%),
    var(--puja-bg);
  color: var(--puja-text);
`;

const TopVisual = styled.div<{ $preview: boolean }>`
  ${(p) => p.$preview && `
    background:
      linear-gradient(180deg, #32150c55 0%, #32150c08 35%, #32150c66 100%),
      url("/templates/Header%20background.jpg") center 45% / cover no-repeat;
  `}
`;

const HeroStage = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 18px 22px 32px;
`;

const Header = styled.header<{ $imageBackdrop?: boolean }>`
  position: relative;
  min-height: 76px;
  padding: 12px clamp(18px, 5vw, 72px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background:
    radial-gradient(circle at 12% 130%, #f4b53f33, transparent 34%),
    linear-gradient(110deg, #7d201c, #a43b1d 60%, #84231c);
  color: #fff8e9;
  border-bottom: 4px solid var(--puja-gold);
  box-shadow: 0 4px 18px #7d201c1c;
  ${(p) => p.$imageBackdrop && `
    background: transparent;
    border-bottom: 0;
    box-shadow: none;
    text-shadow: 0 2px 8px #30140ccc;
  `}
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BrandIcon = styled.div`
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 14px;
  background: white;
  overflow: hidden;
  border: 1px solid #ffe8a9;
  box-shadow: 0 0 0 4px #ffc9631a;
  color: var(--puja-heading);
  display: grid;
  place-items: center;
  img { display: block; width: 100%; height: 100%; object-fit: contain; }
  @media (max-width: 480px) { width: 50px; height: 50px; }
`;

const BrandTitle = styled.div`
  font-family: Georgia, serif;
  font-size: clamp(22px, 3vw, 32px);
  line-height: 1.3;
  font-weight: 700;
`;

const HeaderTag = styled.span`
  display: block;
  margin-top: 5px;
  font-family: Georgia, serif;
  font-size: clamp(14px, 1.8vw, 19px);
  line-height: 1.5;
  color: #ffe0a0;
  letter-spacing: 0.02em;
`;

const AdminButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 12px;
  border: 1px solid #f6d7ae66;
  border-radius: 10px;
  color: #fff8e9;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #fff0bf18; border-color: #ffe0a0; }
  &:disabled { opacity: .6; cursor: wait; }
  @media (max-width: 480px) { padding: 9px; span { display: none; } }
`;

const Main = styled.main`
  max-width: 1120px;
  margin: 0 auto;
  padding: 30px 22px 70px;
`;

// const Eyebrow = styled.div`
//   font-size: 12px;
//   letter-spacing: 0.2em;
//   text-transform: uppercase;
//   color: #ffdda4;
//   font-weight: 700;
// `;

// const HeroTitle = styled.h1`
//   font-family: Georgia, serif;
//   font-size: clamp(36px, 6vw, 64px);
//   line-height: 1.05;
//   margin: 14px 0 12px;
// `;

// const HeroText = styled.p`
//   font-size: clamp(14px, 2vw, 17px);
//   line-height: 1.75;
//   color: var(--puja-gold-soft);
//   max-width: 510px;
//   margin: 0;
// `;

const Welcome = styled.div`
  text-align: center;
  margin: 38px auto 28px;
`;

const WelcomeTitle = styled.h2`
  font-family: Georgia, serif;
  font-size: clamp(26px, 4vw, 36px);
  margin: 0 0 8px;
  color: var(--puja-heading);
  &::after {
    content: "";
    display: block;
    width: 90px;
    height: 3px;
    margin: 16px auto 0;
    border-radius: 3px;
    background: linear-gradient(90deg, #f4b53f33, #dc761e, #f4b53f33);
  }
`;

const Muted = styled.p`
  color: var(--puja-muted);
  line-height: 1.65;
  margin: 0;
`;


const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  max-width: 1100px;
  margin: 0 auto;

  @media (max-width: 850px) {
    grid-template-columns: 1fr;
    max-width: 500px;
  }
`;

const ActionCard = styled.button<{ $accent?: boolean }>`
  border: 1px solid
    ${(p) => (p.$accent ? "#cce0c9" : "var(--puja-border)")};
  border-radius: 22px;
  padding: 24px;
  background: linear-gradient(135deg, var(--puja-surface) 65%, #fff0cc);
  box-shadow: 0 4px 16px #a45d1410;
  display: flex;
  align-items: center;
  gap: 18px;
  text-align: left;
  cursor: pointer;
  min-height: 126px;
  color: var(--puja-text);
  transition: transform 0.18s, box-shadow 0.18s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 30px #57351b12;
  }
`;

const ActionIcon = styled.div<{ $green?: boolean }>`
  width: 58px;
  height: 58px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: ${(p) => (p.$green ? "#eaf4e8" : "var(--puja-gold-soft)")};
  color: ${(p) => (p.$green ? "var(--puja-leaf)" : "var(--puja-primary)")};
`;

const ActionTitle = styled.div`
  font-weight: 750;
  font-size: 18px;
  margin-bottom: 6px;
`;

const ActionDesc = styled.div`
  font-size: 13px;
  color: var(--puja-muted);
  line-height: 1.5;
`;

const CardArrow = styled.div`
  margin-left: auto;
  color: var(--puja-primary);
`;

const Footer = styled.footer`
  text-align: center;
  padding: 22px;
  color: var(--puja-muted);
  font-size: 12px;
  border-top: 1px solid var(--puja-border);
  background: linear-gradient(180deg, #fff3d599, #ffe9b477);
`;

const Panel = styled.section`
  max-width: 760px;
  margin: 8px auto;
  background: var(--puja-surface);
  border: 1px solid var(--puja-border);
  border-radius: 24px;
  padding: clamp(20px, 4vw, 34px);
  box-shadow: 0 12px 35px #67401a0b;
`;

const Back = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: var(--puja-primary);
  font-weight: 650;
  padding: 8px 0 18px;
  cursor: pointer;
`;

const PanelTitle = styled.h2`
  font-family: Georgia, serif;
  font-size: 30px;
  margin: 0 0 8px;
  color: var(--puja-heading);
`;

const Field = styled.label`
  display: grid;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  margin-top: 20px;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid var(--puja-border);
  border-radius: 12px;
  padding: 13px 14px;
  font: inherit;
  color: var(--puja-text);
  background: var(--puja-surface);
  outline: none;

  &:focus {
    border-color: var(--puja-focus);
    box-shadow: 0 0 0 3px #b7773920;
  }
`;

const Upload = styled.label`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 9px;
  min-height: 140px;
  border: 1.5px dashed #c8a77e;
  border-radius: 16px;
  background: var(--puja-surface-soft);
  color: #81502d;
  cursor: pointer;
  text-align: center;
  padding: 18px;

  input {
    display: none;
  }
`;

const Primary = styled.button`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 9px;
  width: 100%;
  border: 0;
  border-radius: 13px;
  padding: 14px 18px;
  margin-top: 20px;
  background: var(--puja-primary-gradient);
  box-shadow: 0 5px 14px #962b1c20;
  color: white;
  font-weight: 750;
  font-size: 15px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Secondary = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--puja-border);
  border-radius: 12px;
  padding: 12px 16px;
  background: var(--puja-surface-soft);
  color: var(--puja-heading);
  font-weight: 700;
  cursor: pointer;
`;

const PreviewWrap = styled.div`
  margin-top: 22px;
  background: var(--puja-surface-soft);
  border-radius: 16px;
  padding: 14px;
  text-align: center;
`;

const PreviewImg = styled.img`
  max-width: 100%;
  max-height: 480px;
  object-fit: contain;
  border-radius: 8px;
`;

const ButtonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const Note = styled.div`
  font-size: 12px;
  color: var(--puja-muted);
  line-height: 1.6;
  margin-top: 12px;
`;

const DonationBox = styled.div`
  background: linear-gradient(135deg, #fff9e8, var(--puja-gold-soft));
  border: 1px solid var(--puja-border);
  border-radius: 18px;
  padding: 22px;
  text-align: center;
  margin-top: 20px;
`;

const QRWrap = styled.div`
  display: inline-block;
  background: white;
  padding: 14px;
  border-radius: 14px;
  margin: 12px auto;
`;

const ErrorText = styled.p`
  color: #b42318;
  font-size: 13px;
  margin: 10px 0 0;
`;

/* ============================================
   IMAGE UTILITIES
============================================ */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error(`Invalid image: ${src}`));
        return;
      }

      resolve(image);
    };

    image.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`));
    };

    image.src = src;
  });
}

function drawCircularPhoto(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number
) {
  const diameter = radius * 2;

  const scale = Math.max(
    diameter / photo.naturalWidth,
    diameter / photo.naturalHeight
  );

  const scaledWidth = photo.naturalWidth * scale;
  const scaledHeight = photo.naturalHeight * scale;

  ctx.save();

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    photo,
    cx - scaledWidth / 2,
    cy - scaledHeight / 2,
    scaledWidth,
    scaledHeight
  );

  ctx.restore();
}

/* ============================================
   APPLICATION
============================================ */

function App() {
  const [adminOpen, setAdminOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Contributor | null>(null);
  const [savedEntry, setSavedEntry] = useState<Contributor | null>(null);
  const [donorName, setDonorName] = useState("");
  const [donorMobile, setDonorMobile] = useState("");
  const [donorAmount, setDonorAmount] = useState("");
  const [donation, setDonation] = useState<Contributor | null>(null);
  const [donationAttempt, setDonationAttempt] = useState<{ requestId: string; name: string; mobileNumber: string; amount: number } | null>(null);
  const [savingDonation, setSavingDonation] = useState(false);
  const [adminToken, setAdminToken] = useState(() => {
    try { return localStorage.getItem("samiti-admin-token") || ""; }
    catch { return ""; }
  });
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const loginAdmin = (token: string) => {
    setAdminToken(token);
    try { localStorage.setItem("samiti-admin-token", token); } catch { /* Keep the in-memory session. */ }
  };
  const logoutAdmin = async () => {
    setLoggingOut(true); setLogoutError("");
    try {
      await adminRequest({ action: "logout", token: adminToken });
      setAdminToken("");
      try { localStorage.removeItem("samiti-admin-token"); } catch { /* Storage may be unavailable. */ }
    } finally { setLoggingOut(false); }
  };
  const [page, setPage] = useState<Page>("home");

  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [badgeUrl, setBadgeUrl] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const upiConfigured =
    Boolean(SITE_CONFIG.upiId) 

  const upiLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: SITE_CONFIG.upiId,
      pn: SITE_CONFIG.payeeName,
      tn: SITE_CONFIG.donationNote,
      cu: "INR",
      ...(donation ? { am: donation.amount.toFixed(2), tr: donation.receiptId.replace(/^CPS-/, "").replace(/-/g, "") } : {}),
    });

    return `upi://pay?${params.toString()}`;
  }, [donation]);

  // Release object URLs when replaced or unmounted.
  useEffect(() => {
    return () => {
      if (photoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  /* ============================================
     PHOTO UPLOAD
  ============================================ */

  const handlePhoto = (file?: File) => {
    setError("");
    setBadgeUrl("");

    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG or WEBP image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Please choose an image smaller than 10 MB.");
      return;
    }

    setPhotoUrl(URL.createObjectURL(file));
  };

  /* ============================================
     BADGE GENERATION
  ============================================ */

  const generate = async () => {
    setError("");

    if (!name.trim() || !photoUrl) {
      setError(
        "Please enter your name and upload your photograph."
      );
      return;
    }

    setIsGenerating(true);
    setBadgeUrl("");

    try {
      // Load the original badge template.
      const template = await loadImage(
        SITE_CONFIG.templatePath
      );

      // Load the user's uploaded photograph.
      const photo = await loadImage(photoUrl);

      console.log("Badge template:", template.src);
      console.log(
        "Template dimensions:",
        template.naturalWidth,
        template.naturalHeight
      );

      // Create canvas with the exact dimensions
      // of the original badge template.
      const canvas = document.createElement("canvas");

      canvas.width = template.naturalWidth;
      canvas.height = template.naturalHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error(
          "Canvas is not supported in this browser."
        );
      }

      // STEP 1: Draw the complete original badge.
      ctx.drawImage(
        template,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // STEP 2: Calculate the circular photo position.
      const p = SITE_CONFIG.photo;

      const cx = canvas.width * p.centerX / 100;
      const cy = canvas.height * p.centerY / 100;
      const radius = canvas.width * p.radius / 100;

      // STEP 3: Draw the uploaded photograph
      // inside the circular placeholder.
      drawCircularPhoto(
        ctx,
        photo,
        cx,
        cy,
        radius
      );

      // STEP 4: Calculate the name position.
      const n = SITE_CONFIG.name;

      const textX = canvas.width * n.x / 100;
      const textY = canvas.height * n.y / 100;

      const fontSize = Math.round(
        canvas.width * n.fontSize / 100
      );

      const maxWidth =
        canvas.width * n.maxWidth / 100;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${fontSize}px Arial, sans-serif`;

      const displayName = name.trim();

      // STEP 5: Draw the nameplate.
      const plateWidth = Math.min(
        maxWidth,
        ctx.measureText(displayName).width + 52
      );

      const plateHeight = fontSize + 24;

      ctx.fillStyle = "#800c12";
      ctx.beginPath();

      ctx.roundRect(
        textX - plateWidth / 2,
        textY - plateHeight / 2,
        plateWidth,
        plateHeight,
        12
      );

      ctx.fill();

      // Golden nameplate border.
      ctx.strokeStyle = "#f8b83c";
      ctx.lineWidth = 3;
      ctx.stroke();

      // STEP 6: Draw the user's name.
      ctx.fillStyle = "#ffffff";

      ctx.fillText(
        displayName,
        textX,
        textY,
        Math.max(1, maxWidth - 36)
      );

      // STEP 7: Export the complete badge.
      const finalBadge = canvas.toDataURL("image/png");

      setBadgeUrl(finalBadge);

    } catch (err) {
      console.error("Badge generation failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating the badge."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  /* ============================================
     DOWNLOAD
  ============================================ */

  const getFileName = () => {
    const safeName =
      name.trim().replace(/[^a-z0-9-_]/gi, "-") ||
      "chhath-badge";

    return `chhath-puja-${safeName}`;
  };

  const downloadPng = () => {
    if (!badgeUrl) return;

    const link = document.createElement("a");

    link.href = badgeUrl;
    link.download = `${getFileName()}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPdf = async () => {
    if (!badgeUrl) return;

    try {
      const image = await loadImage(badgeUrl);

      // Preserve the original badge aspect ratio.
      const width = image.naturalWidth;
      const height = image.naturalHeight;

      const pdf = new jsPDF({
        orientation:
          width >= height ? "landscape" : "portrait",
        unit: "px",
        format: [width, height],
        hotfixes: ["px_scaling"],
      });

      pdf.addImage(
        badgeUrl,
        "PNG",
        0,
        0,
        width,
        height
      );

      pdf.save(`${getFileName()}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Could not download the PDF.");
    }
  };

  /* ============================================
     DONATION
  ============================================ */

  const startDonate = () => {
    setError("");

    if (!upiConfigured) {
      setError(
        "Please configure the Samiti's UPI ID in src/config.ts."
      );
      return;
    }

    window.location.href = upiLink;
  };

  const proceedDonation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingDonation) return;
    setError("");
    const amount = Number(donorAmount);
    if (!donorName.trim() || !Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001) {
      setError("Enter your name and an amount greater than zero, with up to two decimal places.");
      return;
    }
    if (!upiConfigured) { setError("Payments are not configured yet. Please try again later."); return; }
    let mobileNumber: string;
    try { mobileNumber = normalizeMobileNumber(donorMobile); }
    catch (err) { setError(err instanceof Error ? err.message : "Invalid mobile number."); return; }
    const attempt = donationAttempt ?? { requestId: crypto.randomUUID(), name: donorName.trim(), mobileNumber, amount };
    setDonationAttempt(attempt);
    setSavingDonation(true);
    try {
      const result = await adminRequest({ action: "donate", ...attempt });
      if (!result.receiptId || !result.date || !result.time) throw new Error("Entry could not be confirmed. Please click Proceed again to retry safely.");
      const entry = { receiptId: result.receiptId, name: attempt.name, mobileNumber: attempt.mobileNumber, amount: attempt.amount, mode: "Online", status: "verify", date: result.date, time: result.time };
      setDonation(entry); setSavedEntry(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your entry. Please retry.");
    } finally { setSavingDonation(false); }
  };

  const goHome = () => {
    setPage("home");
    setError("");
  };

  /* ============================================
     RENDER
  ============================================ */

  return (
    <Shell>
      <TopVisual $preview={SITE_CONFIG.imageHeaderPreview}>
      <Header $imageBackdrop={SITE_CONFIG.imageHeaderPreview}>
        <Brand>
          <BrandIcon>
            <img src="/templates/Logo.jpg" alt="Chhath Puja Samiti logo" />
          </BrandIcon>

          <div>
            <BrandTitle>
              {SITE_CONFIG.title}
            </BrandTitle>

            <HeaderTag>
              {SITE_CONFIG.subtitle}
            </HeaderTag>
          </div>
        </Brand>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 12 }}>
          <AdminButton type="button" aria-label={adminToken ? "Open admin section" : "Admin login"} title={adminToken ? "Open admin section" : "Admin login"} onClick={() => setAdminOpen(true)}>
            <ShieldCheck size={20} /><span>{adminToken ? "Admin" : "Admin login"}</span>
          </AdminButton>
          {adminToken && <AdminButton type="button" disabled={loggingOut} onClick={() => {
            void logoutAdmin().catch(() => setLogoutError("Unable to log out. Please try again."));
          }}>{loggingOut ? "Logging out..." : "Logout"}</AdminButton>}
        {page !== "home" && (
          <button
            type="button"
            aria-label="Back to home"
            onClick={goHome}
            style={{
              background: "transparent",
              border: 0,
              color: "white",
              cursor: "pointer",
            }}
          >
            <X size={22} />
          </button>
        )}
        </div>
      </Header>
      {page === "home" && SITE_CONFIG.imageHeaderPreview && <HeroStage><HeroSlideshow imageBackdrop /></HeroStage>}
      </TopVisual>
      {logoutError && <ErrorText role="alert">{logoutError}</ErrorText>}

      <Main>
        {/* HOME PAGE */}

        {page === "home" && (
          <>
            {!SITE_CONFIG.imageHeaderPreview && <HeroSlideshow />}

            <Welcome>
              <WelcomeTitle>
                छठ महापर्व पूजनोत्सव - 2026
              </WelcomeTitle>
              <ChhathCountdown />

           
            </Welcome>

            <ActionGrid>
              <ActionCard
                onClick={() => {
                  setPage("badge");
                  setError("");
                }}
              >
                <ActionIcon>
                  <BadgeCheck size={28} />
                </ActionIcon>

                <div>
                  <ActionTitle>
                    Generate Your Badge - अपना बैज जनरेट करें
                  </ActionTitle>

                  <ActionDesc>
                    Upload your photo & name and download your personalized
                    Chhath Puja badge.
                    <br/>अपनी फोटो और नाम अपलोड करें और अपना पर्सनलाइज़्ड
                    छठ पूजा बैज डाउनलोड करें।
                  </ActionDesc>
                </div>

                <CardArrow>
                  <ChevronRight />
                </CardArrow>
              </ActionCard>

              <ActionCard
                $accent
                onClick={() => {
                  setPage("donate");
                  if (donation) {
                    setDonation(null); setDonationAttempt(null);
                    setDonorName(""); setDonorMobile(""); setDonorAmount("");
                  }
                  setError("");
                }}
              >
                <ActionIcon $green>
                  <HeartHandshake size={28} />
                </ActionIcon>

                <div>
                  <ActionTitle>
                    Contribute - चंदा
                  </ActionTitle>

                 
                    
                    <ActionDesc> Support the Chhath Puja celebrations with a voluntary contribution. <br /> स्वैच्छिक योगदान देकर छठ पूजा के आयोजन में सहयोग करें। </ActionDesc>

               
                </div>

                <CardArrow>
                  <ChevronRight />
                </CardArrow>
              </ActionCard>

<ActionCard
  onClick={() => {
    setPage("contributors");
    setError("");
  }}
>
  <ActionIcon>
    <Users size={28} />
  </ActionIcon>

  <div>
    <ActionTitle>
      Our Contributors
    </ActionTitle>

    <ActionDesc>
View Contribution Detail & Download your receipt
<br/>योगदान का विवरण देखें और अपनी रसीद डाउनलोड करें
    </ActionDesc>
  </div>

  <CardArrow>
    <ChevronRight />
  </CardArrow>
</ActionCard>

              <ActionCard onClick={() => setAdminOpen(true)}>
                <ActionIcon><ShieldCheck size={28} /></ActionIcon>
                <div>
                  <ActionTitle>Admin Section</ActionTitle>
                  <ActionDesc>Sign in to add contribution entries.</ActionDesc>
                </div>
                <CardArrow><ChevronRight /></CardArrow>
              </ActionCard>
            </ActionGrid>
          </>
        )}

        {/* BADGE GENERATOR */}

        {page === "badge" && (
          <>
            <Back onClick={goHome}>
              <ArrowLeft size={17} />
              Back to home
            </Back>

            <Panel>
              <PanelTitle>
                Create your badge
              </PanelTitle>

              <Muted>
                Enter your name and upload a clear
                photograph to generate your badge.
              </Muted>

              <Field>
                Full name

                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setBadgeUrl("");
                  }}
                  placeholder="Enter your full name"
                  maxLength={48}
                />
              </Field>

              <Field>Photograph</Field>

              <Upload>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) =>
                    handlePhoto(e.target.files?.[0])
                  }
                />

                <ImagePlus size={30} />

                <strong>
                  {photoUrl
                    ? "Change photograph"
                    : "Choose your photograph"}
                </strong>

                <span
                  style={{
                    fontSize: 12,
                    color: "var(--puja-muted)",
                  }}
                >
                  JPG, PNG or WEBP · Maximum 10 MB
                </span>
              </Upload>

              {photoUrl && (
                <PreviewWrap>
                  <img
                    src={photoUrl}
                    alt="Selected portrait"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 180,
                      borderRadius: 12,
                    }}
                  />

                  <Note>
                    Your photo is processed in your
                    browser and is not uploaded
                    to a server.
                  </Note>
                </PreviewWrap>
              )}

              <Primary
                onClick={generate}
                disabled={
                  !name.trim() ||
                  !photoUrl ||
                  isGenerating
                }
              >
                <Sparkles size={18} />

                {isGenerating
                  ? "Generating..."
                  : "Generate my badge"}
              </Primary>

              {error && (
                <ErrorText>{error}</ErrorText>
              )}

              {badgeUrl && (
                <PreviewWrap>
                  <strong>
                    Your badge is ready!
                  </strong>

                  <div style={{ marginTop: 14 }}>
                    <PreviewImg
                      src={badgeUrl}
                      alt={`Generated badge for ${name}`}
                    />
                  </div>

                  <ButtonRow>
                    <Secondary onClick={downloadPng}>
                      <Download size={17} />
                      Download PNG
                    </Secondary>

                    <Secondary onClick={downloadPdf}>
                      <Download size={17} />
                      Download PDF
                    </Secondary>
                  </ButtonRow>
                </PreviewWrap>
              )}

              <Note>
                <ShieldCheck
                  size={14}
                  style={{ verticalAlign: "middle" }}
                />{" "}
                Your photo stays on this device.
                No account or login is required.
              </Note>
            </Panel>
          </>
        )}

        {/* DONATION PAGE */}

        {page === "donate" && (
          <>
            <Back onClick={goHome}>
              <ArrowLeft size={17} />
              Back to home
            </Back>

            <Panel>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    display: "inline-grid",
                    placeItems: "center",
                    width: 62,
                    height: 62,
                    borderRadius: 20,
                    background: "#eaf4e8",
                    color: "var(--puja-leaf)",
                  }}
                >
                  <Heart size={30} />
                </div>

                <PanelTitle
                  style={{ marginTop: 14 }}
                >
                  Contribution - Chhath Puja 2026
                </PanelTitle>

                <Muted>
                  Your voluntary contribution helps
                  support the celebrations and arrangements.
                </Muted>
              </div>

              {!donation ? <form onSubmit={proceedDonation}>
                <Field>Name<Input required maxLength={100} autoComplete="name" value={donorName} readOnly={savingDonation || Boolean(donationAttempt)} onChange={(e) => setDonorName(e.target.value)} placeholder="Enter your full name" /></Field>
                <Field>Mobile number (optional)<Input type="tel" autoComplete="tel" maxLength={20} value={donorMobile} readOnly={savingDonation || Boolean(donationAttempt)} onChange={(e) => setDonorMobile(e.target.value)} placeholder="10-digit number or +91" /></Field>
                <Field>Amount (INR)<Input required type="number" min="0.01" step="0.01" value={donorAmount} readOnly={savingDonation || Boolean(donationAttempt)} onChange={(e) => setDonorAmount(e.target.value)} placeholder="Enter your contribution amount" /></Field>
                <Primary type="submit" disabled={savingDonation}>{savingDonation ? "Saving your entry..." : "Proceed"}</Primary>
                <Note>No login required. Your entry will await payment verification. Proceeding does not make a payment.</Note>
                {donationAttempt && !savingDonation && <Note>If the connection failed, click Proceed again to confirm the same entry without creating a duplicate.</Note>}
              </form> : <>
              <DonationBox>
                <IndianRupee
                  size={28}
                  color="var(--puja-leaf)"
                />

                <div
                  style={{
                    fontWeight: 750,
                    fontSize: 18,
                    marginTop: 6,
                  }}
                >
                  You are contributing {donation.amount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                </div>

                <Muted>
                  Thank you, {donation.name}. Your entry is awaiting verification.
                </Muted>

                <Primary onClick={startDonate}>
                  <Heart size={17} />
                  Pay by UPI
                </Primary>

                {!upiConfigured && (
                  <ErrorText>
                    UPI ID is not configured yet.
                    Add it in src/config.ts before
                    going live.
                  </ErrorText>
                )}

                <Note>
                  On a phone, Pay by UPI opens a compatible payment app.
                  On a computer, scan the QR code with your phone.
                  {" "}
                  Payment is completed only after
                  you review the details and authorize
                  it in your UPI app.
                </Note>
              </DonationBox>

              {upiConfigured && (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: 22,
                  }}
                >
                  <strong>
                    Or scan to donate
                  </strong>

                  <div>
                    <QRWrap>
                      <QRCodeSVG
                        value={upiLink}
                        size={190}
                        level="H"
                        includeMargin
                      />
                    </QRWrap>
                  </div>

                  <Note>
                    Scan this QR code using a
                    compatible UPI app.
                    The contribution amount is included in this QR code.
                  </Note>
                </div>
              )}
              <Note>Reference: {donation.receiptId}. Status: Verify. Opening a UPI app or scanning the QR does not confirm payment.</Note>
              <Secondary style={{ marginTop: 16 }} onClick={() => { setDonation(null); setDonationAttempt(null); setDonorName(""); setDonorMobile(""); setDonorAmount(""); setError(""); }}>Start another contribution</Secondary>
              </>}

              {error && (
                <ErrorText>{error}</ErrorText>
              )}
            </Panel>
          </>
        )}

{page === "contributors" && (
  <>
    <Back onClick={goHome}>
      <ArrowLeft size={17} />
      Back to home
    </Back>

    <Panel>
      <PanelTitle>
        Our Contributors - हमारे योगदानकर्ता
      </PanelTitle>

      <Muted>
        With gratitude to everyone supporting
        Maa Kamleshwari Chhath Puja Samiti.
      </Muted>

      <Contributors isAdmin={Boolean(adminToken)} savedEntry={savedEntry} onEdit={(entry) => {
        if (!adminToken) return;
        setEditingEntry(entry); setAdminOpen(true);
      }} />
    </Panel>
  </>
)}

      </Main>
      {adminOpen && <AdminSection entry={editingEntry} onSaved={setSavedEntry} token={adminToken} onLogin={loginAdmin} onLogout={logoutAdmin} onClose={() => { setAdminOpen(false); setEditingEntry(null); }} />}

      <Footer>
        <VisitCounter />
        © {new Date().getFullYear()} Maa Kamleshwari Chhath Puja Samiti
        
       
        
        <div id="footer-credit" style={{ marginTop: 14, fontSize: 13 }}>
          Made with <span role="img" aria-label="love">♥ & Maintained by</span> - Govind Choudhary
        </div>
      </Footer>
    </Shell>
  );
}

export default App;
