/** Minimal ElevenLabs text-to-speech client (no SDK dependency, just fetch). */

export interface WordTiming {
  text: string;
  startMs: number;
  endMs: number;
}

export interface SpeechResult {
  audio: Buffer;
  words: WordTiming[];
}

interface AlignmentResponse {
  audio_base64: string;
  alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
}

/** Groups character-level alignment into word-level timings (split on whitespace). */
function charsToWords(alignment: AlignmentResponse["alignment"]): WordTiming[] {
  const words: WordTiming[] = [];
  let current = "";
  let start: number | null = null;
  let end = 0;

  for (let i = 0; i < alignment.characters.length; i++) {
    const ch = alignment.characters[i];
    if (/\s/.test(ch)) {
      if (current.length > 0) {
        words.push({ text: current, startMs: (start ?? 0) * 1000, endMs: end * 1000 });
        current = "";
        start = null;
      }
      continue;
    }
    if (start === null) start = alignment.character_start_times_seconds[i];
    end = alignment.character_end_times_seconds[i];
    current += ch;
  }
  if (current.length > 0) {
    words.push({ text: current, startMs: (start ?? 0) * 1000, endMs: end * 1000 });
  }
  return words;
}

export async function synthesizeSpeech(text: string): Promise<SpeechResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set");
  if (!voiceId) throw new Error("ELEVENLABS_VOICE_ID is not set");

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.45, similarity_boost: 0.8 },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${body}`);
  }

  const json = (await res.json()) as AlignmentResponse;
  return {
    audio: Buffer.from(json.audio_base64, "base64"),
    words: charsToWords(json.alignment),
  };
}
