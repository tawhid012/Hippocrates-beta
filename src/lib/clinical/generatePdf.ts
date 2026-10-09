import { jsPDF } from "jspdf";
import type { NormalizedClinicalSummary } from "./types";
import { parseDrNote } from "./parseDrNote";
import fs from "fs";
import path from "path";

export function generatePdfBlob(summary: NormalizedClinicalSummary): Blob {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  });

  // Try to load Hippocrates logo synchronously on the server-side
  let logoBase64: string | null = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.jpg");
    if (fs.existsSync(logoPath)) {
      const fileBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/jpeg;base64,${fileBuffer.toString("base64")}`;
    }
  } catch (err) {
    console.warn("Failed to load logo from filesystem in PDF generator:", err);
  }

  const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // ~297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // ~182mm

  let y = margin;

  // --- PALETTE CONSTANTS ---
  const C_SLATE_900 = [15, 23, 42] as const;
  const C_SLATE_800 = [30, 41, 59] as const;
  const C_SLATE_700 = [51, 65, 85] as const;
  const C_SLATE_600 = [71, 85, 105] as const;
  const C_SLATE_500 = [100, 116, 139] as const;
  const C_SLATE_400 = [148, 163, 184] as const;
  const C_SLATE_200 = [226, 232, 240] as const;
  const C_SLATE_100 = [241, 245, 249] as const;
  const C_SLATE_50 = [248, 250, 252] as const;
  const C_TEAL_700 = [15, 118, 110] as const;
  const C_TEAL_600 = [13, 148, 136] as const;
  const C_EMERALD_600 = [5, 150, 105] as const;
  const C_CRIMSON_600 = [220, 38, 38] as const;

  // --- HELPERS ---
  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      y = margin + 14; // leave room for running header on continuation pages
    }
  };

  const drawHeaderFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Running Header (pages > 1)
      if (i > 1) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...C_SLATE_500);
        doc.text("HIPPOCRATES CLINICAL PLATFORM", margin, 10);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...C_SLATE_400);
        doc.text("CONFIDENTIAL CLINICAL ASSESSMENT", margin + 65, 10);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C_SLATE_600);
        doc.text(`DOC ID: ${summary.documentId || "N/A"}`, pageWidth - margin, 10, {
          align: "right",
        });

        doc.setDrawColor(...C_SLATE_200);
        doc.setLineWidth(0.3);
        doc.line(margin, 12, pageWidth - margin, 12);
      }

      // Running Footer (every page)
      doc.setDrawColor(...C_SLATE_200);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(...C_SLATE_400);
      doc.text(
        "Hippocrates AI  •  Confidential AI-Generated Clinical Assessment",
        margin,
        pageHeight - 8
      );
      doc.setFont("helvetica", "bold");
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 8, {
        align: "right",
      });
    }
  };

  const drawSectionHeader = (
    title: string,
    accentColor: readonly [number, number, number] = C_TEAL_600,
    badgeText?: string
  ) => {
    checkPageOverflow(14);
    // Sleek slim accent pill
    doc.setFillColor(...accentColor);
    doc.roundedRect(margin, y, 1.4, 4.2, 0.7, 0.7, "F");

    doc.setFontSize(8.8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_SLATE_900);
    doc.text(title.toUpperCase(), margin + 4.5, y + 3.4);

    const titleWidth = doc.getTextWidth(title.toUpperCase());
    const ruleStartX = margin + 4.5 + titleWidth + 3;

    if (badgeText) {
      const badgeW = doc.getTextWidth(badgeText) + 5;
      const badgeX = pageWidth - margin - badgeW;
      doc.setFillColor(...C_SLATE_100);
      doc.setDrawColor(...C_SLATE_200);
      doc.setLineWidth(0.25);
      doc.roundedRect(badgeX, y - 0.5, badgeW, 4.8, 1, 1, "FD");
      doc.setFontSize(6.2);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C_SLATE_600);
      doc.text(badgeText, badgeX + 2.5, y + 2.8);

      if (badgeX > ruleStartX + 5) {
        doc.setDrawColor(...C_SLATE_200);
        doc.setLineWidth(0.3);
        doc.line(ruleStartX, y + 2, badgeX - 3, y + 2);
      }
    } else {
      doc.setDrawColor(...C_SLATE_200);
      doc.setLineWidth(0.3);
      doc.line(ruleStartX, y + 2, pageWidth - margin, y + 2);
    }

    y += 7;
  };

  const drawParagraph = (text: string, indent = 0) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C_SLATE_700);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    checkPageOverflow(lines.length * 3.8 + 2);
    doc.text(lines, margin + indent, y);
    y += lines.length * 3.8 + 2;
  };

  const drawBulletList = (
    items: string[],
    marker = "•",
    markerColor: readonly [number, number, number] = C_TEAL_600
  ) => {
    if (!items || items.length === 0) return;
    for (const item of items) {
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(item, contentWidth - 6);
      checkPageOverflow(lines.length * 3.8 + 1);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...markerColor);
      doc.text(marker, margin + 2, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C_SLATE_700);
      doc.text(lines, margin + 6, y);
      y += lines.length * 3.8 + 1;
    }
    y += 1.5;
  };

  // =========================================================================
  // --- 1. COVER / BRANDING HEADER ---
  // =========================================================================

  // Top Teal Accent Strip
  doc.setFillColor(...C_TEAL_600);
  doc.rect(margin, y, contentWidth, 2.4, "F");
  y += 5.5;

  // Render logo on left if available
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "JPEG", margin, y, 14, 9.5);
    } catch (e) {
      console.warn("Failed to draw logo inside PDF:", e);
    }
  }

  // Branding text
  const brandX = logoBase64 ? margin + 17 : margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...C_SLATE_900);
  doc.text("HIPPOCRATES", brandX, y + 5.5);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_TEAL_700);
  doc.text("AI CLINICAL INTELLIGENCE PLATFORM", brandX + 44, y + 5);

  // Status Badge on Right
  const badgeW = 48;
  const badgeX = pageWidth - margin - badgeW;
  doc.setFillColor(...C_SLATE_100);
  doc.setDrawColor(...C_SLATE_200);
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, y - 0.5, badgeW, 8.5, 1.5, 1.5, "FD");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_SLATE_600);
  doc.text("STATUS: " + (summary.status || "AI GENERATED"), badgeX + badgeW / 2, y + 5, {
    align: "center",
  });

  y += 13.5;

  // Document Title
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_SLATE_800);
  const docTitle =
    summary.conversationTitle || "Clinical Conversation Assessment & Care Plan";
  doc.text(docTitle, margin, y);
  y += 4;

  // Refined hairline separator
  doc.setDrawColor(...C_SLATE_200);
  doc.setLineWidth(0.35);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4.5;

  // =========================================================================
  // --- 2. PATIENT & ENCOUNTER METADATA CARD ---
  // =========================================================================
  checkPageOverflow(26);
  const metaBoxHeight = 22;
  doc.setFillColor(...C_SLATE_50);
  doc.setDrawColor(...C_SLATE_200);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, metaBoxHeight, 2, 2, "FD");

  // Col 1: Patient Demographics
  const col1X = margin + 5;
  doc.setFontSize(6.8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_SLATE_400);
  doc.text("PATIENT DEMOGRAPHICS", col1X, y + 4.8);

  doc.setFontSize(8.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_SLATE_900);
  doc.text(summary.patient?.name || "Unspecified Patient", col1X, y + 9.5);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C_SLATE_600);
  doc.text(
    `Age: ${summary.patient?.age || "Not specified"}   •   Sex: ${
      summary.patient?.sex || "Not specified"
    }`,
    col1X,
    y + 14.5
  );

  // Col 2: Encounter Audit
  const col2X = margin + 64;
  doc.setDrawColor(...C_SLATE_200);
  doc.setLineWidth(0.25);
  doc.line(col2X - 4, y + 3, col2X - 4, y + metaBoxHeight - 3);

  doc.setFontSize(6.8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_SLATE_400);
  doc.text("ENCOUNTER DETAILS", col2X, y + 4.8);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C_SLATE_700);
  doc.text(`Clinical Model: ${summary.model}`, col2X, y + 9.5);
  doc.text(
    `Date: ${new Date(summary.generatedAt).toLocaleDateString()} at ${new Date(
      summary.generatedAt
    ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    col2X,
    y + 14.5
  );

  // Col 3: Document Reference
  const col3X = margin + 124;
  doc.line(col3X - 4, y + 3, col3X - 4, y + metaBoxHeight - 3);

  doc.setFontSize(6.8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_SLATE_400);
  doc.text("RECORD IDENTIFIERS", col3X, y + 4.8);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_SLATE_800);
  doc.text(`Doc ID: ${summary.documentId || "N/A"}`, col3X, y + 9.5);

  doc.setFontSize(6.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C_SLATE_500);
  doc.text(
    `Conv Ref: ${(summary.conversationId || "N/A").slice(0, 16)}...`,
    col3X,
    y + 14.5
  );

  y += metaBoxHeight + 4;

  // =========================================================================
  // --- 3. TRIAGE & RISK STATUS BANNER ---
  // =========================================================================
  if (summary.riskStatus && summary.riskStatus !== "UNKNOWN") {
    checkPageOverflow(14);
    const riskConfigs: Record<
      string,
      {
        fill: readonly [number, number, number];
        border: readonly [number, number, number];
        stripe: readonly [number, number, number];
        text: readonly [number, number, number];
        label: string;
      }
    > = {
      EMERGENCY: {
        fill: [254, 242, 242],
        border: [254, 202, 202],
        stripe: [220, 38, 38],
        text: [153, 27, 27],
        label: "EMERGENCY — IMMEDIATE EVALUATION REQUIRED",
      },
      URGENT: {
        fill: [255, 251, 235],
        border: [253, 230, 138],
        stripe: [217, 119, 6],
        text: [146, 64, 14],
        label: "URGENT — TIMELY CLINICAL EVALUATION RECOMMENDED",
      },
      ROUTINE: {
        fill: [239, 246, 255],
        border: [191, 219, 254],
        stripe: [37, 99, 235],
        text: [30, 64, 175],
        label: "ROUTINE — NON-EMERGENT CLINICAL REVIEW",
      },
      SELF_CARE: {
        fill: [236, 253, 245],
        border: [167, 243, 208],
        stripe: [5, 150, 105],
        text: [6, 95, 70],
        label: "SELF-CARE / LOW ACUITY GUIDANCE",
      },
    };

    const cfg = riskConfigs[summary.riskStatus] || riskConfigs.ROUTINE;
    const bannerH = 9.5;

    // Card background & border
    doc.setFillColor(...cfg.fill);
    doc.setDrawColor(...cfg.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, bannerH, 1.8, 1.8, "FD");

    // Left indicator stripe
    doc.setFillColor(...cfg.stripe);
    doc.roundedRect(margin, y, 2.2, bannerH, 1, 1, "F");

    // Text content
    doc.setFontSize(7.2);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...cfg.text);
    const badgeLabel = `ASSESSMENT STATUS: ${summary.riskStatus}`;
    doc.text(badgeLabel, margin + 5, y + 6);

    const badgeWidth = doc.getTextWidth(badgeLabel);
    const urgencyStmt =
      summary.clinicalSnapshot?.urgencyStatement ||
      "Routine clinical evaluation recommended to investigate reported symptoms.";

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C_SLATE_700);
    const stmtLines = doc.splitTextToSize(
      `—  ${urgencyStmt}`,
      contentWidth - badgeWidth - 10
    );
    doc.text(stmtLines[0] || "", margin + 5 + badgeWidth + 2.5, y + 6);

    y += bannerH + 5;
  }

  // =========================================================================
  // --- 4. CLINICAL SNAPSHOT (RAPID REVIEW CARD) ---
  // =========================================================================
  if (summary.clinicalSnapshot) {
    const snap = summary.clinicalSnapshot;

    // Pre-calculate line counts and wrap text to prevent overflow
    const concernLines = doc.splitTextToSize(
      snap.primaryConcern,
      contentWidth - 42
    );
    const durLines = snap.durationSummary
      ? doc.splitTextToSize(snap.durationSummary, contentWidth - 42)
      : [];
    const sevLines = snap.severitySummary
      ? doc.splitTextToSize(snap.severitySummary, contentWidth - 42)
      : [];

    let estimatedSnapH = 12 + Math.max(concernLines.length * 3.8, 5);

    if (durLines.length > 0) estimatedSnapH += durLines.length * 3.6 + 1.5;
    if (sevLines.length > 0) estimatedSnapH += sevLines.length * 3.6 + 1.5;
    if (snap.keyPositiveFindings?.length)
      estimatedSnapH += snap.keyPositiveFindings.length * 4.2 + 4;
    if (snap.keyNegativeFindings?.length)
      estimatedSnapH += snap.keyNegativeFindings.length * 4.2 + 4;
    if (snap.keyClinicalConsideration) estimatedSnapH += 11;

    // Ensure the card starts on a page where it fits
    checkPageOverflow(estimatedSnapH + 6);

    const snapBoxStartY = y;
    doc.setFillColor(...C_SLATE_50);
    doc.setDrawColor(...C_SLATE_200);
    doc.setLineWidth(0.3);

    // Inner header
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_TEAL_700);
    doc.text("CLINICAL SNAPSHOT", margin + 5, y + 5.5);

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_SLATE_400);
    doc.text("RAPID CASE REVIEW (30-SECOND SYNTHESIS)", margin + 45, y + 5.2);

    doc.setDrawColor(...C_SLATE_200);
    doc.setLineWidth(0.25);
    doc.line(margin + 4, y + 7.5, margin + contentWidth - 4, y + 7.5);

    y += 11;

    // Primary Concern
    doc.setFontSize(7.8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_SLATE_900);
    doc.text("Primary Concern:", margin + 5, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C_SLATE_700);
    doc.text(concernLines, margin + 36, y);
    y += Math.max(concernLines.length * 3.8, 4.5);

    // Timeline & Duration (wrapped properly)
    if (durLines.length > 0) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C_SLATE_600);
      doc.text("Duration:", margin + 5, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C_SLATE_800);
      doc.text(durLines, margin + 36, y);
      y += durLines.length * 3.6 + 1.2;
    }

    // Severity (wrapped properly)
    if (sevLines.length > 0) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C_SLATE_600);
      doc.text("Severity:", margin + 5, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C_SLATE_800);
      doc.text(sevLines, margin + 36, y);
      y += sevLines.length * 3.6 + 1.2;
    }

    // Key Positives
    if (snap.keyPositiveFindings && snap.keyPositiveFindings.length > 0) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C_SLATE_800);
      doc.text("Key Findings:", margin + 5, y);
      y += 3.8;

      for (const f of snap.keyPositiveFindings) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C_TEAL_600);
        doc.text("+", margin + 7, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C_SLATE_800);
        const fl = doc.splitTextToSize(f, contentWidth - 16);
        doc.text(fl, margin + 11, y);
        y += fl.length * 3.6 + 0.8;
      }
    }

    // Pertinent Negatives
    if (snap.keyNegativeFindings && snap.keyNegativeFindings.length > 0) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C_SLATE_600);
      doc.text("Pertinent Negatives:", margin + 5, y);
      y += 3.8;

      for (const f of snap.keyNegativeFindings) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C_SLATE_400);
        doc.text("–", margin + 7, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C_SLATE_600);
        const fl = doc.splitTextToSize(f, contentWidth - 16);
        doc.text(fl, margin + 11, y);
        y += fl.length * 3.6 + 0.8;
      }
    }

    // Key Clinical Consideration
    if (snap.keyClinicalConsideration) {
      y += 1.5;
      const kl = doc.splitTextToSize(
        `Key consideration: ${snap.keyClinicalConsideration}`,
        contentWidth - 14
      );
      const calloutH = Math.max(7.5, kl.length * 3.4 + 4);

      doc.setFillColor(...C_SLATE_100);
      doc.setDrawColor(...C_SLATE_200);
      doc.setLineWidth(0.25);
      doc.roundedRect(
        margin + 4,
        y - 1,
        contentWidth - 8,
        calloutH,
        1.2,
        1.2,
        "FD"
      );

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.2);
      doc.setTextColor(...C_SLATE_700);
      doc.text(kl, margin + 7, y + 3);
      y += calloutH + 1.5;
    }

    // Finalize card container with actual measured height
    const actualSnapH = y - snapBoxStartY + 2;
    doc.setDrawColor(...C_SLATE_200);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, snapBoxStartY, contentWidth, actualSnapH, 2, 2, "S");
    y += 5;
  }

  // =========================================================================
  // --- 5. REASON FOR ASSESSMENT ---
  // =========================================================================
  drawSectionHeader("Reason for Assessment");
  drawParagraph(summary.consultationReason);

  // =========================================================================
  // --- 6. PRESENTING SYMPTOMS & METRIC CHIPS ---
  // =========================================================================
  drawSectionHeader("Presenting Symptoms");
  const sym = summary.symptoms;

  // Primary symptom line
  doc.setFontSize(8.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_SLATE_900);
  doc.text(`Primary Symptom: `, margin, y);
  const pSymW = doc.getTextWidth("Primary Symptom: ");
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C_SLATE_800);
  doc.text(sym.primarySymptom, margin + pSymW, y);
  y += 5.5;

  // 3-Column Metric Box for Duration, Severity, Frequency with Dynamic Wrapping
  if (sym.duration || sym.severity || sym.frequency) {
    const chipColW = contentWidth / 3;
    const durLines = doc.splitTextToSize(sym.duration || "Not specified", chipColW - 8);
    const sevLines = doc.splitTextToSize(sym.severity || "Not specified", chipColW - 8);
    const freqLines = doc.splitTextToSize(sym.frequency || "Not specified", chipColW - 8);
    const maxLines = Math.max(durLines.length, sevLines.length, freqLines.length, 1);
    const chipBoxH = Math.max(12, maxLines * 3.6 + 7);

    checkPageOverflow(chipBoxH + 4);
    doc.setFillColor(...C_SLATE_50);
    doc.setDrawColor(...C_SLATE_200);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, chipBoxH, 1.5, 1.5, "FD");

    // Col 1: Duration
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_SLATE_400);
    doc.text("DURATION", margin + 4, y + 3.8);
    doc.setFontSize(7.2);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_SLATE_800);
    doc.text(durLines, margin + 4, y + 7.5);

    // Col 2: Severity
    doc.setDrawColor(...C_SLATE_200);
    doc.line(margin + chipColW, y + 2, margin + chipColW, y + chipBoxH - 2);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_SLATE_400);
    doc.text("SEVERITY", margin + chipColW + 4, y + 3.8);
    doc.setFontSize(7.2);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_SLATE_800);
    doc.text(sevLines, margin + chipColW + 4, y + 7.5);

    // Col 3: Frequency
    doc.line(margin + chipColW * 2, y + 2, margin + chipColW * 2, y + chipBoxH - 2);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_SLATE_400);
    doc.text("FREQUENCY", margin + chipColW * 2 + 4, y + 3.8);
    doc.setFontSize(7.2);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_SLATE_800);
    doc.text(freqLines, margin + chipColW * 2 + 4, y + 7.5);

    y += chipBoxH + 4;
  }

  // Associated Symptoms
  if (sym.associatedSymptoms && sym.associatedSymptoms.length > 0) {
    doc.setFontSize(7.8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_SLATE_800);
    doc.text("Associated Symptoms Reported:", margin, y);
    y += 4;
    drawBulletList(sym.associatedSymptoms, "•", C_TEAL_600);
  }

  // Pertinent Negatives (explicitly denied)
  if (summary.pertinentNegatives && summary.pertinentNegatives.length > 0) {
    doc.setFontSize(7.8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_SLATE_700);
    doc.text("Pertinent Negatives (Patient Specifically Denied):", margin, y);
    y += 4;
    drawBulletList(summary.pertinentNegatives, "–", C_SLATE_500);
  }

  // =========================================================================
  // --- 7. RELEVANT MEDICAL HISTORY ---
  // =========================================================================
  drawSectionHeader("Relevant Medical History");
  const hist = summary.history;
  const historyParts: string[] = [];
  if (hist.previousConditions?.length)
    historyParts.push(`Prior Conditions: ${hist.previousConditions.join(", ")}`);
  if (hist.currentMedications?.length)
    historyParts.push(`Current Medications: ${hist.currentMedications.join(", ")}`);
  if (hist.allergies?.length)
    historyParts.push(`Allergies: ${hist.allergies.join(", ")}`);
  if (hist.recentIllnessExposure)
    historyParts.push(`Recent Exposure / Illness: ${hist.recentIllnessExposure}`);
  if (hist.lifestyleFactors)
    historyParts.push(`Lifestyle / Context: ${hist.lifestyleFactors}`);

  if (historyParts.length > 0) {
    drawBulletList(historyParts, "•", C_SLATE_600);
  } else {
    drawParagraph(
      "No prior chronic medical conditions, regular medications, or allergies reported during consultation."
    );
  }

  // =========================================================================
  // --- 8. CLINICAL CONSIDERATIONS (STRUCTURED DIFFERENTIAL) ---
  // =========================================================================
  if (
    summary.clinicalConsiderations &&
    summary.clinicalConsiderations.length > 0
  ) {
    drawSectionHeader(
      "Clinical Considerations",
      C_SLATE_800,
      "DIFFERENTIAL (NON-CONFIRMATORY)"
    );

    doc.setFontSize(7.2);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...C_SLATE_500);
    drawParagraph(
      "The following clinical possibilities are considered based solely on patient-reported interaction. These are preliminary considerations, not formal diagnoses."
    );

    for (let ci = 0; ci < summary.clinicalConsiderations.length; ci++) {
      const cons = summary.clinicalConsiderations[ci];

      // Pre-calculate line counts and wrap texts
      const nameLines = doc.splitTextToSize(cons.name, contentWidth - 45);
      const noteLines = cons.clinicalNote
        ? doc.splitTextToSize(cons.clinicalNote, contentWidth - 12)
        : [];
      const supLines = (cons.supportingFeatures || []).map((sf) =>
        doc.splitTextToSize(sf, contentWidth - 16)
      );
      const uncLines = (cons.uncertaintyNotes || []).map((un) =>
        doc.splitTextToSize(un, contentWidth - 16)
      );

      // Calculate total card height
      let cardH = 8 + Math.max(nameLines.length * 3.6, 5);
      if (noteLines.length > 0) cardH += noteLines.length * 3.6 + 2.5;
      if (supLines.length > 0) {
        cardH += 4 + supLines.reduce((acc, l) => acc + l.length * 3.6 + 0.8, 0);
      }
      if (uncLines.length > 0) {
        cardH += 4 + uncLines.reduce((acc, l) => acc + l.length * 3.6 + 0.8, 0);
      }
      cardH += 3.5; // bottom padding

      // PREVENT CARD SPLIT: Check overflow BEFORE starting this card!
      checkPageOverflow(cardH + 4);

      const cardStartY = y;
      doc.setFillColor(...C_SLATE_50);
      doc.setDrawColor(...C_SLATE_200);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, cardStartY, contentWidth, cardH, 2, 2, "FD");

      // Header: Number pill + name
      doc.setFillColor(...C_SLATE_800);
      doc.roundedRect(margin + 4, y + 2, 7, 5, 1, 1, "F");
      doc.setFontSize(6.8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(
        String(ci + 1).padStart(2, "0"),
        margin + 7.5,
        y + 5.6,
        { align: "center" }
      );

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C_SLATE_900);
      doc.text(nameLines, margin + 14, y + 5.6);

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C_SLATE_400);
      doc.text(
        "Preliminary Consideration",
        pageWidth - margin - 4,
        y + 5.5,
        { align: "right" }
      );

      y += 8 + nameLines.length * 3.6;

      // Clinical Note
      if (noteLines.length > 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.6);
        doc.setTextColor(...C_SLATE_600);
        doc.text(noteLines, margin + 6, y);
        y += noteLines.length * 3.6 + 2.5;
      }

      // Supporting features
      if (supLines.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.2);
        doc.setTextColor(...C_SLATE_700);
        doc.text("Supporting Evidence:", margin + 6, y);
        y += 3.5;

        for (const sfl of supLines) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...C_TEAL_600);
          doc.text("•", margin + 8, y);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(...C_SLATE_700);
          doc.text(sfl, margin + 12, y);
          y += sfl.length * 3.6 + 0.8;
        }
      }

      // Uncertainty notes
      if (uncLines.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.2);
        doc.setTextColor(...C_SLATE_500);
        doc.text("Diagnostic Uncertainty & Verification Needed:", margin + 6, y);
        y += 3.5;

        for (const unl of uncLines) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...C_SLATE_400);
          doc.text("–", margin + 8, y);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(...C_SLATE_600);
          doc.text(unl, margin + 12, y);
          y += unl.length * 3.6 + 0.8;
        }
      }

      y = cardStartY + cardH + 4;
    }
  } else if (summary.clinicalUnderstanding?.possibleExplanations?.length) {
    drawSectionHeader("Clinical Considerations", C_SLATE_800);
    drawBulletList(summary.clinicalUnderstanding.possibleExplanations);
  }

  // =========================================================================
  // --- 9. FINDINGS FROM UPLOADED REPORTS ---
  // =========================================================================
  if (summary.reportFindings && summary.reportFindings.length > 0) {
    drawSectionHeader("Findings From Uploaded Reports", C_TEAL_600);
    for (const f of summary.reportFindings) {
      drawParagraph(
        `• ${f.testName}: ${f.resultValue} ${
          f.referenceRange ? `(Ref: ${f.referenceRange})` : ""
        } — ${f.interpretation || "AI-assisted interpretation"}`
      );
    }
  }

  // =========================================================================
  // --- 10. CLINICIAN & ORACLE HANDOFF NOTE (SBAR / SOAP) ---
  // =========================================================================
  if (summary.drNote) {
    const parsedNote = parseDrNote(summary.drNote);

    // Pre-calculate SBAR height
    let sbarH = 9;
    for (const sec of parsedNote.sections) {
      if (sec.category === "safety") {
        const sl = doc.splitTextToSize(sec.content, contentWidth - 12);
        sbarH += sl.length * 3.2 + 3;
      } else if (sec.bullets && sec.bullets.length > 0) {
        sbarH += 4 + sec.bullets.reduce((acc, b) => {
          return acc + doc.splitTextToSize(b, contentWidth - 16).length * 3.6 + 0.8;
        }, 0);
      } else {
        const lines = doc.splitTextToSize(sec.content, contentWidth - 12);
        sbarH += 4 + lines.length * 3.5 + 2;
      }
    }
    sbarH += 4;

    // Check overflow BEFORE starting SBAR
    checkPageOverflow(Math.min(sbarH, 75));

    drawSectionHeader(
      "Clinical Encounter Note & Handoff (SBAR)",
      C_SLATE_800,
      "HEALTHCARE PROVIDER BRIEFING"
    );

    const handoffStartY = y;
    doc.setFillColor(...C_SLATE_50);
    doc.setDrawColor(...C_SLATE_200);
    doc.setLineWidth(0.35);

    // Inner header
    y += 2;
    doc.setFontSize(7.2);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_SLATE_500);
    doc.text(
      "STRUCTURED CLINICAL BRIEFING  •  PRE-CONSULTATION ENCOUNTER NOTE",
      margin + 5,
      y + 3.5
    );
    y += 7;

    if (parsedNote.sections.length > 0) {
      for (const sec of parsedNote.sections) {
        if (sec.category === "safety") {
          // Safety Note: render as subtle verification notice
          y += 1.5;
          doc.setFont("helvetica", "italic");
          doc.setFontSize(6.8);
          doc.setTextColor(...C_SLATE_500);
          const sl = doc.splitTextToSize(sec.content, contentWidth - 12);
          doc.text(sl, margin + 5, y);
          y += sl.length * 3.2 + 2.5;
          continue;
        }

        // Section Label
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        if (sec.category === "urgency") {
          doc.setTextColor(...C_TEAL_700);
        } else if (sec.category === "complaint") {
          doc.setTextColor(...C_SLATE_900);
        } else {
          doc.setTextColor(...C_SLATE_800);
        }
        doc.text(sec.label.toUpperCase() + ":", margin + 5, y);
        y += 4;

        if (sec.bullets && sec.bullets.length > 0) {
          for (const b of sec.bullets) {
            const marker =
              sec.category === "positives"
                ? "+"
                : sec.category === "negatives"
                ? "–"
                : "•";
            const markerColor: readonly [number, number, number] =
              sec.category === "positives"
                ? C_TEAL_600
                : sec.category === "negatives"
                ? C_SLATE_400
                : C_SLATE_600;

            const bl = doc.splitTextToSize(b, contentWidth - 16);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...markerColor);
            doc.text(marker, margin + 7, y);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(...C_SLATE_700);
            doc.text(bl, margin + 11, y);
            y += bl.length * 3.6 + 0.8;
          }
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.8);
          doc.setTextColor(...C_SLATE_700);
          const lines = doc.splitTextToSize(sec.content, contentWidth - 12);
          doc.text(lines, margin + 5, y);
          y += lines.length * 3.5 + 2;
        }

        y += 1;
      }
    } else {
      drawParagraph(summary.drNote, 5);
    }

    // Outer box boundary for handoff
    const actualHandoffH = y - handoffStartY + 2;
    doc.setDrawColor(...C_SLATE_200);
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, handoffStartY, contentWidth, actualHandoffH, 2, 2, "S");
    y += 5;
  }

  // =========================================================================
  // --- 11. INFORMATION GAPS & ASSESSMENT LIMITATIONS ---
  // (Only shown as standalone if NOT already covered in SBAR note above)
  // =========================================================================
  if (!summary.drNote) {
    if (summary.informationGaps && summary.informationGaps.length > 0) {
      drawSectionHeader("Clinical Information Gaps", C_SLATE_500);
      drawBulletList(summary.informationGaps, "•", C_SLATE_500);
    }

    const limitations =
      summary.assessmentLimitations && summary.assessmentLimitations.length > 0
        ? summary.assessmentLimitations
        : [
            "Physical examination not performed remotely",
            "Vital signs and objective biometrics unmeasured",
            "No diagnostic imaging, ECG, or laboratory testing performed",
          ];
    drawSectionHeader("Assessment Limitations", C_SLATE_500);
    drawBulletList(limitations, "•", C_SLATE_400);
  }

  // =========================================================================
  // --- 12. CARE & SELF-MANAGEMENT GUIDANCE ---
  // =========================================================================
  if (summary.guidance && summary.guidance.length > 0) {
    drawSectionHeader("Care & Self-Management Guidance", C_EMERALD_600);
    for (let gi = 0; gi < summary.guidance.length; gi++) {
      const g = summary.guidance[gi];
      doc.setFontSize(7.8);
      const lines = doc.splitTextToSize(g, contentWidth - 10);
      checkPageOverflow(lines.length * 3.6 + 1.5);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C_EMERALD_600);
      doc.text(`[${gi + 1}]`, margin + 2, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C_SLATE_700);
      doc.text(lines, margin + 8, y);
      y += lines.length * 3.6 + 1.5;
    }
    y += 2;
  }

  // =========================================================================
  // --- 13. MEDICATION DISCUSSION ---
  // (Only rendered when valid non-undefined medications exist)
  // =========================================================================
  const validMeds = (summary.medicationDiscussion || []).filter(
    (med) =>
      med &&
      typeof med.medication === "string" &&
      med.medication.trim().length > 1 &&
      med.medication.trim().toLowerCase() !== "undefined" &&
      med.medication.trim().toLowerCase() !== "none" &&
      med.medication.trim().toLowerCase() !== "not specified"
  );

  if (validMeds.length > 0) {
    checkPageOverflow(15 + validMeds.length * 8);
    drawSectionHeader("Medication Discussion");
    for (const med of validMeds) {
      const parts = [`• ${med.medication}`];
      if (med.purpose && med.purpose !== "Not specified") parts.push(`Purpose: ${med.purpose}`);
      if (med.dose && med.dose !== "Not specified") parts.push(`Dose: ${med.dose}`);
      if (med.frequency && med.frequency !== "Not specified") parts.push(`Freq: ${med.frequency}`);
      drawParagraph(parts.join("  |  "));
    }
  }

  // =========================================================================
  // --- 14. PRESCRIPTION DRAFT (CLINICIAN REVIEW REQUIRED) ---
  // =========================================================================
  if (
    summary.hasPrescriptionDraft &&
    summary.prescriptionDraft &&
    summary.prescriptionDraft.length > 0
  ) {
    checkPageOverflow(35);
    drawSectionHeader(
      "Prescription Draft — Clinician Review Required",
      C_CRIMSON_600
    );

    const rxH = 10 + summary.prescriptionDraft.length * 9;
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(252, 165, 165);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, rxH, 2, 2, "FD");

    doc.setFontSize(7.2);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(185, 28, 28);
    doc.text(
      "NON-VALID MEDICAL DRAFT • REQUIRES FORMAL CLINICIAN AUTHORIZATION",
      margin + 5,
      y + 5
    );

    let py = y + 10;
    for (const rx of summary.prescriptionDraft) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.8);
      doc.setTextColor(...C_SLATE_900);
      doc.text(
        `Rx: ${rx.medicine} (${rx.strength || "Strength unspecified"})`,
        margin + 5,
        py
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(...C_SLATE_700);
      doc.text(
        `Route: ${rx.route || "Oral"}  |  Frequency: ${
          rx.frequency || "As directed"
        }  |  Duration: ${rx.duration || "As directed"}`,
        margin + 5,
        py + 3.8
      );
      py += 8.5;
    }
    y = py + 3;
  }

  // =========================================================================
  // --- 15. RED-FLAG & EMERGENCY SAFETY INFORMATION ---
  // =========================================================================
  if (summary.safetyWarnings && summary.safetyWarnings.length > 0) {
    let alertTextH = 10;
    for (const w of summary.safetyWarnings) {
      const wl = doc.splitTextToSize(w, contentWidth - 16);
      alertTextH += wl.length * 3.6 + 1.2;
    }

    checkPageOverflow(alertTextH + 12);
    drawSectionHeader(
      "Red-Flag & Emergency Safety Warnings",
      C_CRIMSON_600,
      "CRITICAL SAFETY"
    );

    const alertStartY = y;
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, alertStartY, contentWidth, alertTextH, 2, 2, "FD");

    // Left crimson stripe
    doc.setFillColor(...C_CRIMSON_600);
    doc.roundedRect(margin, alertStartY, 2.2, alertTextH, 1, 1, "F");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_CRIMSON_600);
    doc.text(
      "SEEK IMMEDIATE EMERGENCY MEDICAL CARE IF ANY OF THE FOLLOWING OCCUR:",
      margin + 6,
      alertStartY + 5
    );

    let wy = alertStartY + 8.5;
    for (const w of summary.safetyWarnings) {
      const wl = doc.splitTextToSize(w, contentWidth - 16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C_CRIMSON_600);
      doc.text("!", margin + 7, wy);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(153, 27, 27);
      doc.text(wl, margin + 11, wy);
      wy += wl.length * 3.6 + 1.2;
    }

    y = alertStartY + alertTextH + 5;
  }

  // =========================================================================
  // --- 16. FOLLOW-UP PLAN ---
  // =========================================================================
  checkPageOverflow(26);
  drawSectionHeader("Follow-Up Plan", C_TEAL_600);
  const fu = summary.followUp;
  if (fu.recommendedMonitoring)
    drawParagraph(`Recommended Monitoring: ${fu.recommendedMonitoring}`);
  if (fu.suggestedFollowUp)
    drawParagraph(`Suggested Follow-Up: ${fu.suggestedFollowUp}`);
  if (fu.whenToSeekCare)
    drawParagraph(`When to Seek Care: ${fu.whenToSeekCare}`);

  // =========================================================================
  // --- 17. LEGAL DISCLAIMER & COPYRIGHT BOX ---
  // =========================================================================
  checkPageOverflow(26);
  y += 2;
  const disclaimerH = 22;
  doc.setFillColor(...C_SLATE_50);
  doc.setDrawColor(...C_SLATE_200);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, disclaimerH, 2, 2, "FD");

  doc.setFontSize(6.8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_SLATE_600);
  doc.text("IMPORTANT CLINICAL & LEGAL NOTICE", margin + 5, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(...C_SLATE_500);
  const disclaimerLines = doc.splitTextToSize(
    summary.disclaimer,
    contentWidth - 10
  );
  doc.text(disclaimerLines, margin + 5, y + 8.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(...C_SLATE_600);
  doc.text(
    `${summary.copyright || "© 2026 Hippocrates AI Clinical Platform. All rights reserved."}   •   Doc ID: ${summary.documentId || "N/A"}`,
    margin + 5,
    y + disclaimerH - 3
  );

  // Apply running header and footer across all pages
  drawHeaderFooter();

  return doc.output("blob");
}
