import { Composition } from "remotion";
import { ReelComposition, reelSchema } from "./ReelComposition";
import { CarouselSlide, carouselSlideSchema } from "./CarouselSlide";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Reel"
        component={ReelComposition}
        durationInFrames={FPS * 45}
        fps={FPS}
        width={1080}
        height={1920}
        schema={reelSchema}
        defaultProps={{
          captionWords: [],
          audioSrc: "",
        }}
      />
      <Composition
        id="CarouselSlide"
        component={CarouselSlide}
        durationInFrames={1}
        fps={FPS}
        width={1080}
        height={1350}
        schema={carouselSlideSchema}
        defaultProps={{
          text: "",
          citation: null,
          subtext: null,
          slideNumber: 1,
          totalSlides: 5,
          isCta: false,
          backgroundImage: null,
        }}
      />
    </>
  );
};
