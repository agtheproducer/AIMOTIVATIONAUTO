import { z } from "zod";
import { AbsoluteFill } from "remotion";

export const carouselSlideSchema = z.object({
  text: z.string(),
  slideNumber: z.number(),
  totalSlides: z.number(),
  isCta: z.boolean(),
});

type Props = z.infer<typeof carouselSlideSchema>;

// Single still frame, rendered once per carousel slide via renderStill().
// Brand visual system lives here: swap fonts/colors once, every slide and
// every future render picks it up.
export const CarouselSlide: React.FC<Props> = ({ text, slideNumber, totalSlides, isCta }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        color: "#ffffff",
        fontFamily: "Helvetica, Arial, sans-serif",
        padding: 80,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: isCta ? 64 : 56,
          fontWeight: 800,
          lineHeight: 1.25,
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 80,
          right: 80,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 28,
          color: "#888888",
        }}
      >
        <span>{slideNumber} / {totalSlides}</span>
        {isCta ? <span>Comment MOTIVATION &rarr;</span> : <span>Swipe &rarr;</span>}
      </div>
    </AbsoluteFill>
  );
};
