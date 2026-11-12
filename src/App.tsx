
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import { Users } from "lucide-react";
import Contributors from "./components/Contributors";
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
  Sun,
  X,
} from "lucide-react";
import { SITE_CONFIG } from "./config";

type Page = "home" | "badge" | "donate"| "contributors";;

/* ============================================
   STYLED COMPONENTS
============================================ */

const Shell = styled.div`
  min-height: 100vh;
  background: #fff9ef;
  color: #402516;
`;

const Header = styled.header`
  min-height: 76px;
  padding: 12px clamp(18px, 5vw, 72px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #713d20;
  color: #fff8e9;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BrandIcon = styled.div`
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 14px;
  background: #f5c477;
  color: #713d20;
  display: grid;
  place-items: center;
`;

const BrandTitle = styled.div`
  font-family: Georgia, serif;
  font-size: clamp(18px, 2.4vw, 24px);
  font-weight: 700;
`;

const HeaderTag = styled.span`
  font-size: 12px;
  color: #f6d7ae;
  letter-spacing: 0.08em;
`;

const Main = styled.main`
  max-width: 1120px;
  margin: 0 auto;
  padding: 30px 22px 70px;
`;

const Hero = styled.section`
  overflow: hidden;
  border-radius: 28px;
  position: relative;
  min-height: 300px;
  display: flex;
  align-items: center;

  background:
    linear-gradient(
      90deg,
      rgba(55, 29, 13, 0.84),
      rgba(55, 29, 13, 0.24)
    ),
    url("/templates/hero-cover.png") center / cover no-repeat,
    #9c5525;

  @media (max-width: 640px) {
    min-height: 260px;
  }
`;

const HeroContent = styled.div`
  padding: clamp(28px, 6vw, 64px);
  max-width: 680px;
  color: #fff8e9;
`;

const Eyebrow = styled.div`
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #ffdda4;
  font-weight: 700;
`;

const HeroTitle = styled.h1`
  font-family: Georgia, serif;
  font-size: clamp(36px, 6vw, 64px);
  line-height: 1.05;
  margin: 14px 0 12px;
`;

const HeroText = styled.p`
  font-size: clamp(14px, 2vw, 17px);
  line-height: 1.75;
  color: #fff0d8;
  max-width: 510px;
  margin: 0;
`;

const Welcome = styled.div`
  text-align: center;
  margin: 38px auto 28px;
`;

const WelcomeTitle = styled.h2`
  font-family: Georgia, serif;
  font-size: clamp(26px, 4vw, 36px);
  margin: 0 0 8px;
  color: #713d20;
`;

const Muted = styled.p`
  color: #8b6a4d;
  line-height: 1.65;
  margin: 0;
`;


const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
    ${(p) => (p.$accent ? "#cce0c9" : "#ead6b9")};
  border-radius: 22px;
  padding: 24px;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 18px;
  text-align: left;
  cursor: pointer;
  min-height: 126px;
  color: #4b2c1b;
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
  background: ${(p) => (p.$green ? "#eaf4e8" : "#fff0d8")};
  color: ${(p) => (p.$green ? "#347342" : "#a45a18")};
`;

const ActionTitle = styled.div`
  font-weight: 750;
  font-size: 18px;
  margin-bottom: 6px;
`;

const ActionDesc = styled.div`
  font-size: 13px;
  color: #8a7058;
  line-height: 1.5;
`;

const CardArrow = styled.div`
  margin-left: auto;
  color: #a45a18;
`;

const Footer = styled.footer`
  text-align: center;
  padding: 22px;
  color: #9a8066;
  font-size: 12px;
`;

const Panel = styled.section`
  max-width: 760px;
  margin: 8px auto;
  background: #fff;
  border: 1px solid #ecdcc5;
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
  color: #86532e;
  font-weight: 650;
  padding: 8px 0 18px;
  cursor: pointer;
`;

const PanelTitle = styled.h2`
  font-family: Georgia, serif;
  font-size: 30px;
  margin: 0 0 8px;
  color: #713d20;
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
  border: 1px solid #e3d2bb;
  border-radius: 12px;
  padding: 13px 14px;
  font: inherit;
  color: #402516;
  background: #fffdf9;
  outline: none;

  &:focus {
    border-color: #b77739;
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
  background: #fffbf4;
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
  background: #8a4b22;
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
  border: 1px solid #dfc7a8;
  border-radius: 12px;
  padding: 12px 16px;
  background: #fffaf2;
  color: #71421f;
  font-weight: 700;
  cursor: pointer;
`;

const PreviewWrap = styled.div`
  margin-top: 22px;
  background: #fff8ec;
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
  color: #90765e;
  line-height: 1.6;
  margin-top: 12px;
`;

const DonationBox = styled.div`
  background: #f5faef;
  border: 1px solid #d9e9d2;
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
  const [page, setPage] = useState<Page>("home");

  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [badgeUrl, setBadgeUrl] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const upiConfigured =
    Boolean(SITE_CONFIG.upiId) &&
    SITE_CONFIG.upiId !== "YOUR_UPI_ID@BANK";

  const upiLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: SITE_CONFIG.upiId,
      pn: SITE_CONFIG.payeeName,
      tn: SITE_CONFIG.donationNote,
      cu: "INR",
    });

    return `upi://pay?${params.toString()}`;
  }, []);

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

  const goHome = () => {
    setPage("home");
    setError("");
  };

  /* ============================================
     RENDER
  ============================================ */

  return (
    <Shell>
      <Header>
        <Brand>
          <BrandIcon>
            <Sun size={25} />
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
      </Header>

      <Main>
        {/* HOME PAGE */}

        {page === "home" && (
          <>
            <Hero>
              <HeroContent>
                {/* <Eyebrow>
                  Festival of faith & gratitude
                </Eyebrow> */}
{/* 
                <HeroTitle>
                  जय छठी मैया
                </HeroTitle>

                <HeroText>
                  छठी मैया के पावन पर्व पर आपका
                  हार्दिक स्वागत है।
                  Celebrate the spirit of devotion,
                  unity and gratitude.
                </HeroText> */}
              </HeroContent>
            </Hero>

            <Welcome>
              <WelcomeTitle>
                Maa Kamleshwari Chhath Puja Samiti
              </WelcomeTitle>

              <Muted>
                Choose how you would like to participate.
              </Muted>
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
                    Generate Your Badge
                  </ActionTitle>

                  <ActionDesc>
                    Create and download your personalized
                    Chhath Puja badge.
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
                  setError("");
                }}
              >
                <ActionIcon $green>
                  <HeartHandshake size={28} />
                </ActionIcon>

                <div>
                  <ActionTitle>
                    Donate
                  </ActionTitle>

                  <ActionDesc>
                    Support the Chhath Puja celebrations
                    with a voluntary contribution.
                  </ActionDesc>
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
      View the list of people who have
      contributed to Chhath Puja.
    </ActionDesc>
  </div>

  <CardArrow>
    <ChevronRight />
  </CardArrow>
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
                    color: "#92765b",
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
                    color: "#347342",
                  }}
                >
                  <Heart size={30} />
                </div>

                <PanelTitle
                  style={{ marginTop: 14 }}
                >
                  Support Chhath Puja
                </PanelTitle>

                <Muted>
                  Your voluntary contribution helps
                  support the celebrations and arrangements.
                </Muted>
              </div>

              <DonationBox>
                <IndianRupee
                  size={28}
                  color="#347342"
                />

                <div
                  style={{
                    fontWeight: 750,
                    fontSize: 18,
                    marginTop: 6,
                  }}
                >
                  Contribute any amount
                </div>

                <Muted>
                  Enter your preferred amount
                  in your UPI app.
                </Muted>

                <Primary onClick={startDonate}>
                  <Heart size={17} />
                  Donate via UPI
                </Primary>

                {!upiConfigured && (
                  <ErrorText>
                    UPI ID is not configured yet.
                    Add it in src/config.ts before
                    going live.
                  </ErrorText>
                )}

                <Note>
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
                    Enter your preferred amount
                    before making payment.
                  </Note>
                </div>
              )}

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
        Our Contributors
      </PanelTitle>

      <Muted>
        With gratitude to everyone supporting
        Maa Kamleshwari Chhath Puja Samiti.
      </Muted>

      <Contributors />
    </Panel>
  </>
)}

      </Main>

      <Footer>
        © {new Date().getFullYear()} Chhath Puja Samiti
        {" · "}
        श्रद्धा • आस्था • समर्पण
      </Footer>
    </Shell>
  );
}

export default App;
