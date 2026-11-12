
export type ReceiptData = {
    receiptId: string;
    name: string;
    date: string;
    time: string;
    amount: number;
  };
  
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  
  export async function generateReceipt(
    data: ReceiptData
  ): Promise<void> {
    // Wait for Hindi fonts to become available.
    if (document.fonts) {
      await Promise.all([
        document.fonts.load('32px "Noto Sans Devanagari"'),
        document.fonts.ready,
      ]);
    }
  
    const canvas = document.createElement("canvas");
    const width = 900;
    const height = 1200;
  
    canvas.width = width;
    canvas.height = height;
  
    const ctx = canvas.getContext("2d");
  
    if (!ctx) {
      throw new Error("Canvas is unavailable.");
    }
  
    const hindi = '"Noto Sans Devanagari", sans-serif';
    const maroon = "#741a20";
    const gold = "#d99a31";
  
    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#fff0ce");
    bg.addColorStop(0.55, "#fffaf0");
    bg.addColorStop(1, "#ffe0a0");
  
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  
    // Decorative borders
    ctx.strokeStyle = maroon;
    ctx.lineWidth = 12;
    ctx.strokeRect(22, 22, width - 44, height - 44);
  
    ctx.strokeStyle = gold;
    ctx.lineWidth = 5;
    ctx.strokeRect(39, 39, width - 78, height - 78);
  
    // Festive sun
    const sunX = width / 2;
    const sunY = 245;
    const sunRadius = 65;
  
    ctx.save();
    ctx.translate(sunX, sunY);
  
    ctx.strokeStyle = gold;
    ctx.lineWidth = 5;
  
    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI * 2) / 24;
  
      ctx.beginPath();
      ctx.moveTo(
        Math.cos(angle) * 78,
        Math.sin(angle) * 78
      );
      ctx.lineTo(
        Math.cos(angle) * 105,
        Math.sin(angle) * 105
      );
      ctx.stroke();
    }
  
    ctx.fillStyle = "#f6aa26";
    ctx.beginPath();
    ctx.arc(0, 0, sunRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  
    // Text helper
    const centerText = (
      text: string,
      y: number,
      size: number,
      color = maroon,
      bold = false,
      maxWidth = width - 120
    ) => {
      ctx.fillStyle = color;
      ctx.font = `${bold ? 700 : 400} ${size}px ${hindi}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, width / 2, y, maxWidth);
    };
  
    centerText(
      "माँ कमलेश्वरी छठ पूजा समिति",
      115,
      40,
      maroon,
      true
    );
  
    centerText(
      "हरि घाट - पोखराम",
      165,
      29
    );
  
    // Title
    ctx.fillStyle = maroon;
    ctx.fillRect(125, 370, 650, 75);
  
    centerText(
      "सहयोग रसीद",
      408,
      42,
      "#ffffff",
      true
    );
  
    centerText(
      `रसीद संख्या : ${data.receiptId}`,
      485,
      25,
      maroon,
      true
    );
  
    // Details panel
    ctx.fillStyle = "#fffdf6";
    ctx.fillRect(85, 535, 730, 350);
  
    ctx.strokeStyle = gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(85, 535, 730, 350);
  
    const details = [
      ["नाम", data.name],
      ["दिनांक", data.date],
      ["समय", data.time],
      ["सहयोग राशि", formatAmount(data.amount)],
    ];
  
    details.forEach(([label, value], index) => {
      const y = 600 + index * 78;
  
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
  
      ctx.font = `700 29px ${hindi}`;
      ctx.fillStyle = maroon;
      ctx.fillText(`${label} :`, 125, y);
  
      ctx.font = `600 29px ${hindi}`;
      ctx.fillStyle = "#43251c";
      ctx.fillText(value, 355, y, 405);
  
      if (index < details.length - 1) {
        ctx.strokeStyle = "#ead6b7";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(125, y + 37);
        ctx.lineTo(775, y + 37);
        ctx.stroke();
      }
    });
  
    // Blessing
    centerText(
      "आपके सहयोग के लिए हार्दिक धन्यवाद।",
      955,
      29,
      maroon,
      true
    );
  
    centerText(
      "छठी मैया आपकी सभी मनोकामनाओं की",
      1005,
      27
    );
  
    centerText(
      "पूर्ति करें।",
      1050,
      27
    );
  
    // Footer
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(160, 1090);
    ctx.lineTo(740, 1090);
    ctx.stroke();
  
    centerText(
      "प्राप्तकर्ता - Digital Team",
      1120,
      25,
      maroon,
      true
    );
  
    // Download PNG
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("Receipt export failed")),
        "image/png"
      );
    });
  
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
  
    link.href = url;
    link.download = `Chhath-Receipt-${data.receiptId}.png`;
  
    document.body.appendChild(link);
    link.click();
    link.remove();
  
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  