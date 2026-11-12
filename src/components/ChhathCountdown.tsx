import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { Sparkles } from "lucide-react";
import { getCountdown } from "../utils/countdown";

const flicker = keyframes`
  from { transform: scale(.92); opacity: .8; }
  to { transform: scale(1.06); opacity: 1; }
`;
const Celebration = styled.section`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  max-width: 620px;
  margin: 22px auto;
  padding: 24px clamp(12px, 3vw, 30px) 20px;
  border: 1px solid var(--puja-border);
  border-radius: 24px;
  background:
    linear-gradient(180deg, #32150c35, #23100988),
    url("/templates/background-image2.jpg") center / cover no-repeat;
  box-shadow: 0 10px 30px #ac681013, inset 0 0 0 5px #ffffff66;
  &::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 7px;
    background: repeating-linear-gradient(90deg, #df7c25 0 14px, #f3bc48 14px 28px, #77944d 28px 35px, #f3bc48 35px 49px);
  }
`;
const Heading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff8e9;
  text-shadow: 0 2px 8px #231009bb;
  font-size: clamp(15px, 3.5vw, 20px);
  font-weight: 700;
`;
const Timer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: clamp(4px, 1.5vw, 12px);
  margin: 20px auto 16px;
  font-variant-numeric: tabular-nums;
`;
const Unit = styled.div`
  flex: 1;
  max-width: 100px;
  min-width: 0;
  span {
    display: block;
    padding: 13px 4px;
    border: 1px solid var(--puja-border);
    border-radius: 14px;
    background: linear-gradient(155deg, var(--puja-surface), #ffe8b9);
    box-shadow: 0 4px 0 #e8c58f55;
    color: var(--puja-heading);
    font-size: clamp(26px, 6vw, 42px);
    line-height: 1.1;
    font-weight: 800;
  }
  small { display: block; margin-top: 10px; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #fff1cb; text-shadow: 0 1px 5px #231009; }
`;
const Separator = styled.span`
  padding-top: 15px;
  font-size: clamp(22px, 5vw, 32px);
  color: #ffe0a0;
`;
const Blessing = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  color: #ffe0a0;
  text-shadow: 0 1px 5px #231009;
  font-size: 13px;
  svg { flex-shrink: 0; }
  .flame { transform-origin: 12px 14px; animation: ${flicker} 1.8s ease-in-out infinite alternate; }
  @media (prefers-reduced-motion: reduce) { .flame { animation: none; } }
`;

function Diya() {
  return <svg width="26" height="28" viewBox="0 0 24 28" fill="none" aria-hidden="true">
    <path className="flame" d="M12 1C11 6 6 8 8 12c2 4 8 3 8-1 0-3-3-5-4-10Z" fill="#ee9c24" />
    <path d="M12 8c-2 3-2 5 0 6 2-1 2-3 0-6Z" fill="#fff4bb" />
    <path d="M2 17h20c-1 6-5 9-10 9S3 23 2 17Z" fill="#b2592a" />
    <path d="M2 17c5 3 15 3 20 0M8 24h8" stroke="#f3c46e" strokeWidth="1.5" strokeLinecap="round" />
  </svg>;
}

export default function ChhathCountdown() {
  const [time, setTime] = useState(() => getCountdown(Date.now()));
  useEffect(() => {
    const interval = window.setInterval(() => setTime(getCountdown(Date.now())), 1000);
    return () => window.clearInterval(interval);
  }, []);
  return <Celebration aria-label="Chhath Puja countdown">
    <Heading><Sparkles size={18} aria-hidden="true" /><span>{time.complete ? "छठ महापर्व की हार्दिक शुभकामनाएँ" : "अर्घ्य की पावन बेला की ओर"}</span><Sparkles size={18} aria-hidden="true" /></Heading>
    <Timer role="timer" aria-live="off" aria-label={`${time.days} days, ${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds remaining`}>
      <Unit><span>{String(time.days).padStart(2, "0")}</span><small>Days</small></Unit>
      <Separator aria-hidden="true">:</Separator>
      <Unit><span>{String(time.hours).padStart(2, "0")}</span><small>Hours</small></Unit>
      <Separator aria-hidden="true">:</Separator>
      <Unit><span>{String(time.minutes).padStart(2, "0")}</span><small>Minutes</small></Unit>
      <Separator aria-hidden="true">:</Separator>
      <Unit><span>{String(time.seconds).padStart(2, "0")}</span><small>Seconds</small></Unit>
    </Timer>
    <Blessing><Diya /><span>श्रद्धा • आस्था • समर्पण</span><Diya /></Blessing>
  </Celebration>;
}
