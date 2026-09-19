import { z } from "zod";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const wordSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
});

export const reelSchema = z.object({
  captionWords: z.array(wordSchema),
  // Filename relative to remotion/public/, resolved via staticFile() below.
  audioSrc: z.string(),
});

type Props = z.infer<typeof reelSchema>;

// Solid background for now -- swap AbsoluteFill's background for a <Video>
// or a looping b-roll clip once a visual source is picked (see README,
// "b-roll" in the technical plan).
export const ReelComposition: React.FC<Props> = ({ captionWords, audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;

  const activeIndex = captionWords.findIndex(
    (w) => nowMs >= w.startMs && nowMs < w.endMs
  );
  const windowStart = Math.max(0, activeIndex - 3);
  const windowWords = captionWords.slice(windowStart, windowStart + 7);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 260,
        }}
      >
        <div
          style={{
            fontFamily: "Helvetica, Arial, sans-serif",
            fontSize: 68,
            fontWeight: 800,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.2,
          }}
        >
          {windowWords.map((w, i) => (
            <span
              key={windowStart + i}
              style={{
                color: windowStart + i === activeIndex ? "#ffcc00" : "#ffffff",
                marginRight: 14,
              }}
            >
              {w.text}
            </span>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
