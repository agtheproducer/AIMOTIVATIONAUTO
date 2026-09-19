import { z } from "zod";
import { AbsoluteFill } from "remotion";
import { BRAND_NAME, colors, fonts } from "./theme.js";

export const carouselSlideSchema = z.object({
  text: z.string(),
  // Shown as a hairline-underlined mono mark on content slides. Never on CTA
  // slides. Never colored -- see the graphic chart's "Citation mark" note:
  // accent color is reserved for action, not the science.
  citation: z.string().nullable(),
  // Second line on the CTA slide only (e.g. "Comment MOTIVATION for today's task via DM.")
  subtext: z.string().nullable(),
  slideNumber: z.number(),
  totalSlides: z.number(),
  isCta: z.boolean(),
});

type Props = z.infer<typeof carouselSlideSchema>;

// Single still frame, rendered once per carousel slide via renderStill().
// Mirrors the "Templates" board of the graphic chart 1:1 -- change the
// look there first, then port the change here.
export const CarouselSlide: React.FC<Props> = ({
  text,
  citation,
  subtext,
  slideNumber,
  totalSlides,
  isCta,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        fontFamily: fonts.sans,
        padding: 100,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 100,
          fontFamily: fonts.mono,
          fontSize: 26,
          letterSpacing: 2,
          color: colors.textSecondary,
          textTransform: "uppercase",
        }}
      >
        {BRAND_NAME}
      </div>

      <div
        style={{
          fontSize: isCta ? 96 : 88,
          fontWeight: 800,
          lineHeight: 1.3,
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </div>

      {isCta && subtext ? (
        <div style={{ fontSize: 48, color: colors.textSecondary, lineHeight: 1.4 }}>{subtext}</div>
      ) : null}

      {isCta ? (
        <div
          style={{
            background: colors.accent,
            color: colors.ink,
            borderRadius: 999,
            padding: "28px 48px",
            fontWeight: 700,
            fontSize: 46,
            width: "fit-content",
          }}
        >
          Comment MOTIVATION &darr;
        </div>
      ) : citation ? (
        <div
          style={{
            display: "inline-block",
            borderBottom: `2px solid ${colors.border}`,
            paddingBottom: 10,
            fontFamily: fonts.mono,
            fontSize: 34,
            letterSpacing: 1,
            color: colors.textSecondary,
            textTransform: "uppercase",
            width: "fit-content",
          }}
        >
          Source &mdash; {citation}
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          bottom: 56,
          left: 100,
          right: 100,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 34,
          color: colors.textSecondary,
        }}
      >
        <span>
          {slideNumber} / {totalSlides}
        </span>
        <span>{isCta ? "Posted 2x/day" : "Swipe →"}</span>
      </div>
    </AbsoluteFill>
  );
};
