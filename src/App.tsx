import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import {
  ArrowLeft, BadgeCheck, ChevronRight, Download, Heart, HeartHandshake,
  ImagePlus, IndianRupee, ShieldCheck, Sparkles, Sun, X
} from "lucide-react";
import { SITE_CONFIG } from "./config";

type Page = "home" | "badge" | "donate";

const Shell = styled.div`
  min-height: 100vh;
  background: #fff9ef;
  color: #402516;
`;
const Header = styled.header`
  height: 76px; padding: 0 clamp(18px, 5vw, 72px);
  display:flex; align-items:center; justify-content:space-between;
  background:#713d20; color:#fff8e9;
  box-shadow:0 4px 18px #4d28151c;
`;
const Brand = styled.div`display:flex;align-items:center;gap:12px;`;
const BrandIcon = styled.div`
  width:42px;height:42px;border-radius:14px;background:#f5c477;color:#713d20;
  display:grid;place-items:center;
`;
const BrandTitle = styled.div`
  font-family:Georgia,serif;font-size:clamp(18px,2.4vw,24px);font-weight:700;
`;
const HeaderTag = styled.span`font-size:12px;color:#f6d7ae;letter-spacing:.08em;`;
const Main = styled.main`max-width:1120px;margin:0 auto;padding:30px 22px 70px;`;
const Hero = styled.section`
  overflow:hidden;border-radius:28px;position:relative;min-height:300px;
  display:flex;align-items:center;background:
  linear-gradient(90deg,rgba(55,29,13,.84),rgba(55,29,13,.24)),
  url("https://images.unsplash.com/photo-1604608672516-5b1f6c9f0f4b?auto=format&fit=crop&w=1800&q=85") center 48%/cover,
  linear-gradient(120deg,#9c5525,#e9a84d);
  @media(max-width:640px){min-height:260px;}
`;
const HeroContent = styled.div`padding:clamp(28px,6vw,64px);max-width:680px;color:#fff8e9;`;
const Eyebrow = styled.div`font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#ffdda4;font-weight:700;`;
const HeroTitle = styled.h1`
  font-family:Georgia,serif;font-size:clamp(36px,6vw,64px);line-height:1.05;
  margin:14px 0 12px;font-weight:700;
`;
const HeroText = styled.p`font-size:clamp(14px,2vw,17px);line-height:1.75;color:#fff0d8;max-width:510px;margin:0;`;
const Welcome = styled.div`text-align:center;margin:38px auto 28px;`;
const WelcomeTitle = styled.h2`font-family:Georgia,serif;font-size:clamp(26px,4vw,36px);margin:0 0 8px;color:#713d20;`;
const Muted = styled.p`color:#8b6a4d;line-height:1.65;margin:0;`;
const ActionGrid = styled.div`
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;
  max-width:850px;margin:0 auto;
  @media(max-width:640px){grid-template-columns:1fr;}
`;
const ActionCard = styled.button<{ $accent?: boolean }>`
  border:1px solid ${p=>p.$accent?"#cce0c9":"#ead6b9"};border-radius:22px;
  padding:24px;background:#fff;display:flex;align-items:center;gap:18px;
  text-align:left;cursor:pointer;min-height:126px;color:#4b2c1b;
  transition:transform .18s,box-shadow .18s;
  &:hover{transform:translateY(-3px);box-shadow:0 14px 30px #57351b12;}
`;
const ActionIcon = styled.div<{ $green?: boolean }>`
  width:58px;height:58px;border-radius:18px;display:grid;place-items:center;flex:none;
  background:${p=>p.$green?"#eaf4e8":"#fff0d8"};
  color:${p=>p.$green?"#347342":"#a45a18"};
`;
const ActionTitle = styled.div`font-weight:750;font-size:18px;margin-bottom:6px;`;
const ActionDesc = styled.div`font-size:13px;color:#8a7058;line-height:1.5;`;
const CardArrow = styled.div`margin-left:auto;color:#a45a18;`;
const Footer = styled.footer`text-align:center;padding:22px;color:#9a8066;font-size:12px;`;
const Panel = styled.section`
  max-width:760px;margin:8px auto;background:#fff;border:1px solid #ecdcc5;
  border-radius:24px;padding:clamp(20px,4vw,34px);box-shadow:0 12px 35px #67401a0b;
`;
const Back = styled.button`
  display:inline-flex;align-items:center;gap:8px;border:0;background:transparent;
  color:#86532e;font-weight:650;padding:8px 0 18px;cursor:pointer;
`;
const PanelTitle = styled.h2`font-family:Georgia,serif;font-size:30px;margin:0 0 8px;color:#713d20;`;
const Field = styled.label`display:grid;gap:8px;font-size:13px;font-weight:700;margin-top:20px;`;
const Input = styled.input`
  width:100%;box-sizing:border-box;border:1px solid #e3d2bb;border-radius:12px;
  padding:13px 14px;font:inherit;color:#402516;background:#fffdf9;outline:none;
  &:focus{border-color:#b77739;box-shadow:0 0 0 3px #b7773920;}
`;
const Upload = styled.label`
  display:flex;align-items:center;justify-content:center;flex-direction:column;gap:9px;
  min-height:140px;border:1.5px dashed #c8a77e;border-radius:16px;
  background:#fffbf4;color:#81502d;cursor:pointer;text-align:center;padding:18px;
  input{display:none;}
`;
const Primary = styled.button`
  display:inline-flex;justify-content:center;align-items:center;gap:9px;
  width:100%;border:0;border-radius:13px;padding:14px 18px;margin-top:20px;
  background:#8a4b22;color:white;font-weight:750;font-size:15px;cursor:pointer;
  &:disabled{opacity:.5;cursor:not-allowed;}
`;
const Secondary = styled.button`
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  border:1px solid #dfc7a8;border-radius:12px;padding:12px 16px;background:#fffaf2;
  color:#71421f;font-weight:700;cursor:pointer;
`;
const PreviewWrap = styled.div`margin-top:22px;background:#fff8ec;border-radius:16px;padding:14px;text-align:center;`;
const PreviewImg = styled.img`max-width:100%;max-height:480px;object-fit:contain;border-radius:8px;`;
const ButtonRow = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:10px;@media(max-width:420px){grid-template-columns:1fr;}`;
const Note = styled.div`font-size:12px;color:#90765e;line-height:1.6;margin-top:12px;`;
const DonationBox = styled.div`background:#f5faef;border:1px solid #d9e9d2;border-radius:18px;padding:22px;text-align:center;margin-top:20px;`;
const QRWrap = styled.div`display:inline-block;background:white;padding:14px;border-radius:14px;margin:12px auto;`;
const ErrorText = styled.p`color:#b42318;font-size:13px;margin:10px 0 0;`;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
function coverImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / image.width, h / image.height);
  const sw = w / scale, sh = h / scale;
  const sx = (image.width - sw) / 2, sy = (image.height - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
}
function App() {
  const [page, setPage] = useState<Page>("home");
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [badgeUrl, setBadgeUrl] = useState("");
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches);
  const fileRef = useRef<HTMLInputElement>(null);
  const upiLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: SITE_CONFIG.upiId, pn: SITE_CONFIG.payeeName,
      tn: SITE_CONFIG.donationNote, cu: "INR"
    });
    return `upi://pay?${params.toString()}`;
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setIsMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    return () => {
      if (photoUrl.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  useEffect(() => {
    return () => {
      if (badgeUrl.startsWith("blob:")) URL.revokeObjectURL(badgeUrl);
    };
  }, [badgeUrl]);

  const handlePhoto = (file?: File) => {
    setError("");
    setBadgeUrl("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Please upload a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Please choose an image smaller than 10 MB.");
      return;
    }
    setPhotoUrl(URL.createObjectURL(file));
  };

  const generate = async () => {
    setError("");
    if (!name.trim() || !photoUrl) {
      setError("Please enter your name and upload your photograph.");
      return;
    }
    try {
      const [template, photo] = await Promise.all([
        loadImage(SITE_CONFIG.templatePath),
        loadImage(photoUrl)
      ]);
      const canvas = document.createElement("canvas");
      canvas.width = template.naturalWidth;
      canvas.height = template.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not supported in this browser.");
      ctx.drawImage(template, 0, 0);
      const p = SITE_CONFIG.photo;
      const x = canvas.width * p.x / 100, y = canvas.height * p.y / 100;
      const w = canvas.width * p.width / 100, h = canvas.height * p.height / 100;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.08);
      ctx.clip();
      coverImage(ctx, photo, x, y, w, h);
      ctx.restore();

      const n = SITE_CONFIG.name;
      ctx.fillStyle = "#713d20";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.round(canvas.width * n.fontSize / 100)}px Arial`;
      let displayName = name.trim();
      while (ctx.measureText(displayName).width > canvas.width * n.maxWidth / 100 && displayName.length > 4) {
        displayName = displayName.slice(0, -2) + "…";
      }
      ctx.fillText(displayName, canvas.width * n.x / 100, canvas.height * n.y / 100);
      setBadgeUrl(canvas.toDataURL("image/png"));
    } catch {
      setError("Could not load the badge template. Check that public/templates/badge-template.svg exists.");
    }
  };

  const downloadPng = () => {
    if (!badgeUrl) return;
    const link = document.createElement("a");
    link.href = badgeUrl;
    link.download = `${name.trim().replace(/[^a-z0-9-_]/gi, "-") || "chhath-badge"}.png`;
    link.click();
  };
  const downloadPdf = async () => {
    if (!badgeUrl) return;
    const image = await loadImage(badgeUrl);
    const pdf = new jsPDF({ orientation: image.width >= image.height ? "landscape" : "portrait", unit: "px", format: [image.width, image.height] });
    pdf.addImage(badgeUrl, "PNG", 0, 0, image.width, image.height);
    pdf.save(`${name.trim().replace(/[^a-z0-9-_]/gi, "-") || "chhath-badge"}.pdf`);
  };
  const startDonate = () => {
    if (SITE_CONFIG.upiId === "YOUR_UPI_ID@BANK") {
      setError("Donation setup pending: add the Samiti's UPI ID in src/config.ts before publishing.");
      return;
    }
    window.location.href = upiLink;
  };

  return (
    <Shell>
      <Header>
        <Brand>
          <BrandIcon><Sun size={25} /></BrandIcon>
          <div><BrandTitle>{SITE_CONFIG.title}</BrandTitle><HeaderTag>{SITE_CONFIG.subtitle}</HeaderTag></div>
        </Brand>
        {page !== "home" && <button aria-label="Back to home" onClick={() => {setPage("home");setError("");}} style={{background:"transparent",border:0,color:"white",cursor:"pointer"}}><X size={22}/></button>}
      </Header>

      <Main>
        {page === "home" && <>
          <Hero>
            <HeroContent>
              <Eyebrow>Festival of faith & gratitude</Eyebrow>
              <HeroTitle>जय छठी मैया</HeroTitle>
              <HeroText>छठी मैया के पावन पर्व पर आपका हार्दिक स्वागत है। Celebrate the spirit of devotion, unity and gratitude.</HeroText>
            </HeroContent>
          </Hero>
          <Welcome>
            <WelcomeTitle>Chhath Puja Samiti</WelcomeTitle>
            <Muted>Choose how you would like to participate.</Muted>
          </Welcome>
          <ActionGrid>
            <ActionCard onClick={() => {setPage("badge");setError("");}}>
              <ActionIcon><BadgeCheck size={28}/></ActionIcon>
              <div><ActionTitle>Generate Your Badge</ActionTitle><ActionDesc>Create and download your personalized Chhath Puja badge.</ActionDesc></div>
              <CardArrow><ChevronRight/></CardArrow>
            </ActionCard>
            <ActionCard $accent onClick={() => {setPage("donate");setError("");}}>
              <ActionIcon $green><HeartHandshake size={28}/></ActionIcon>
              <div><ActionTitle>Donate</ActionTitle><ActionDesc>Support the Chhath Puja celebrations with a voluntary contribution.</ActionDesc></div>
              <CardArrow><ChevronRight/></CardArrow>
            </ActionCard>
          </ActionGrid>
        </>}

        {page === "badge" && <>
          <Back onClick={() => setPage("home")}><ArrowLeft size={17}/> Back to home</Back>
          <Panel>
            <PanelTitle>Create your badge</PanelTitle>
            <Muted>Enter your name and upload a clear photograph to generate your badge.</Muted>
            <Field>Full name<Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" maxLength={48}/></Field>
            <Field>Photograph</Field>
            <Upload>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={e => handlePhoto(e.target.files?.[0])}/>
              <ImagePlus size={30}/><strong>{photoUrl ? "Change photograph" : "Choose your photograph"}</strong>
              <span style={{fontSize:12,color:"#92765b"}}>JPG, PNG or WEBP · Maximum 10 MB</span>
            </Upload>
            {photoUrl && <PreviewWrap><img src={photoUrl} alt="Selected portrait" style={{maxWidth:"100%",maxHeight:180,borderRadius:12}}/><Note>Your photo is processed in your browser and is not uploaded to a server.</Note></PreviewWrap>}
            <Primary onClick={generate} disabled={!name.trim() || !photoUrl}><Sparkles size={18}/> Generate my badge</Primary>
            {error && page === "badge" && <ErrorText>{error}</ErrorText>}
            {badgeUrl && <PreviewWrap>
              <strong>Your badge is ready!</strong><br/>
              <PreviewImg src={badgeUrl} alt={`Generated badge for ${name}`}/>
              <ButtonRow><Secondary onClick={downloadPng}><Download size={17}/> Download PNG</Secondary><Secondary onClick={downloadPdf}><Download size={17}/> Download PDF</Secondary></ButtonRow>
            </PreviewWrap>}
            <Note><ShieldCheck size={14} style={{verticalAlign:"middle"}}/> Your photo stays on this device. No account or login is required.</Note>
          </Panel>
        </>}

        {page === "donate" && <>
          <Back onClick={() => setPage("home")}><ArrowLeft size={17}/> Back to home</Back>
          <Panel>
            <div style={{textAlign:"center"}}>
              <div style={{display:"inline-grid",placeItems:"center",width:62,height:62,borderRadius:20,background:"#eaf4e8",color:"#347342"}}><Heart size={30}/></div>
              <PanelTitle style={{marginTop:14}}>Support Chhath Puja</PanelTitle>
              <Muted>Your voluntary contribution helps support the celebrations and arrangements.</Muted>
            </div>
            <DonationBox>
              <IndianRupee size={28} color="#347342"/>
              <div style={{fontWeight:750,fontSize:18,marginTop:6}}>Contribute any amount</div>
              <Muted>Enter your preferred amount in your UPI app.</Muted>
              {isMobile && <Primary onClick={startDonate}><Heart size={17}/> Donate via UPI</Primary>}
              {SITE_CONFIG.upiId === "YOUR_UPI_ID@BANK" && <ErrorText style={{marginTop:12}}>UPI ID is not configured yet. Add it in src/config.ts before going live.</ErrorText>}
              <Note>Payment is completed only after you review the details and authorize it in your UPI app. The website does not collect or store your UPI PIN.</Note>
            </DonationBox>
            <div style={{textAlign:"center",marginTop:22}}>
              <strong>{isMobile ? "Or scan to donate from another device" : "Scan to donate with any UPI app"}</strong>
              <div><QRWrap><QRCodeSVG value={upiLink} size={190} level="H" includeMargin/></QRWrap></div>
              <Note>Scan this QR code using any compatible UPI app. The amount is left blank so you can enter it yourself.</Note>
            </div>
            {error && page === "donate" && <ErrorText>{error}</ErrorText>}
          </Panel>
        </>}
      </Main>
      <Footer>© {new Date().getFullYear()} Chhath Puja Samiti · श्रद्धा • आस्था • समर्पण</Footer>
    </Shell>
  );
}
export default App;
