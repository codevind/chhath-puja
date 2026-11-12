import { useEffect, useState } from "react";
import styled from "styled-components";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { slideshowImages } from "../data/slideshow";

const slides = slideshowImages.map((name, index) => ({
  src: `/slideshow/${name}`,
  alt: index === 0 ? "Chhath Puja Samiti members gathered by the river" : `Chhath Puja celebration photograph ${index}`,
}));

const Gallery = styled.section<{ $imageBackdrop: boolean }>`
  position: relative;
  overflow: hidden;
  isolation: isolate;
  height: clamp(280px, 45vw, 500px);
  border-radius: 28px;
  background: #492b1c;
  box-shadow: 0 8px 25px #713d2018;
  ${(p) => p.$imageBackdrop && `
    background: #fff8e908;
    border: 1px solid #ffe0a044;
    box-shadow: 0 12px 36px #30140c33;
    .backdrop { display: none; }
  `}
`;
const Track = styled.div<{ $index: number }>`
  display: flex;
  height: 100%;
  transform: translateX(${(p) => -p.$index * 100}%);
  transition: transform 850ms cubic-bezier(.22, .61, .36, 1);
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;
const Slide = styled.div`
  position: relative;
  flex: 0 0 100%;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  .backdrop { position: absolute; inset: -20px; width: calc(100% + 40px); height: calc(100% + 40px); object-fit: cover; filter: blur(18px) brightness(.45); }
  .photo { position: relative; width: 100%; height: 100%; object-fit: contain; padding-bottom: 38px; }
`;
const Control = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 38px;
  height: 38px;
  border: 1px solid #fff8e966;
  border-radius: 50%;
  background: #40251699;
  color: #fff8e9;
  cursor: pointer;
  &:hover { background: var(--puja-heading); }
  &:focus-visible { outline: 3px solid var(--puja-gold); outline-offset: 3px; }
`;
const Arrow = styled(Control)<{ $right?: boolean }>`
  position: absolute;
  top: calc(50% - 19px);
  ${(p) => p.$right ? "right: 12px;" : "left: 12px;"}
`;
const Controls = styled.div`
  position: absolute;
  left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(8px, 2vw, 16px);
  padding: 8px 12px;
  background: linear-gradient(transparent, #301c13bb);
  color: #fff8e9;
  font-size: 12px;
  > button { width: 28px; height: 28px; }
`;
const Dot = styled.button<{ $active: boolean }>`
  width: 22px;
  height: 28px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  &::after { content: ""; display: block; margin: auto; width: ${(p) => p.$active ? "18px" : "7px"}; height: 7px; border-radius: 8px; background: ${(p) => p.$active ? "var(--puja-gold)" : "#fff8e988"}; }
`;

export default function HeroSlideshow({ imageBackdrop = false }: { imageBackdrop?: boolean }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  useEffect(() => {
    if (paused || hidden) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % slides.length), 2000);
    return () => window.clearTimeout(timer);
  }, [index, paused, hidden]);
  useEffect(() => {
    const next = new Image();
    next.src = slides[(index + 1) % slides.length].src;
  }, [index]);
  const move = (offset: number) => setIndex((current) => (current + offset + slides.length) % slides.length);
  const firstDot = Math.max(0, Math.min(index - 3, slides.length - 7));

  return <Gallery $imageBackdrop={imageBackdrop} aria-label="Chhath Puja celebration photos" aria-roledescription="carousel">
    <Track $index={index}>
      {slides.map((slide, slideIndex) => <Slide key={slide.src} role="group" aria-roledescription="slide" aria-label={`${slideIndex + 1} of ${slides.length}`} aria-hidden={slideIndex !== index}>
        <img className="backdrop" src={slide.src} alt="" aria-hidden="true" loading={slideIndex === 0 ? "eager" : "lazy"} decoding="async" />
        <img className="photo" src={slide.src} alt={slide.alt} loading={slideIndex === 0 ? "eager" : "lazy"} fetchPriority={slideIndex === 0 ? "high" : "auto"} decoding="async" />
      </Slide>)}
    </Track>
    <Arrow type="button" aria-label="Previous photo" onClick={() => move(-1)}><ChevronLeft size={22} /></Arrow>
    <Arrow $right type="button" aria-label="Next photo" onClick={() => move(1)}><ChevronRight size={22} /></Arrow>
    <Controls>
      <span>{index + 1} / {slides.length}</span>
      <div style={{ display: "flex" }}>
        {slides.slice(firstDot, firstDot + 7).map((slide, offset) => {
          const slideIndex = firstDot + offset;
          return <Dot key={slide.src} $active={slideIndex === index} type="button" aria-label={`Show photo ${slideIndex + 1}`} aria-current={slideIndex === index ? "true" : undefined} onClick={() => setIndex(slideIndex)} />;
        })}
      </div>
      <Control type="button" aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={() => setPaused((value) => !value)}>{paused ? <Play size={14} /> : <Pause size={14} />}</Control>
    </Controls>
  </Gallery>;
}
