// Transistor.fm transcript parser
// Parses the custom text format: [HH:MM:SS] timestamps with Speaker: labels

export interface TranscriptSegment {
  speaker: string;
  text: string;
  startTime: number; // seconds
  endTime: number; // seconds
}

export interface ParseResult {
  segments: TranscriptSegment[];
  totalDuration: number;
  speakerCounts: Record<string, number>;
  errors: string[];
}

// Convert [HH:MM:SS] timestamp to seconds
export function timestampToSeconds(timestamp: string): number {
  const match = timestamp.match(/\[?(\d{2}):(\d{2}):(\d{2})\]?/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);

  return hours * 3600 + minutes * 60 + seconds;
}

// Normalize speaker name: "fraser" -> "Fraser", "nabeel" -> "Nabeel"
// Also handles full names like "Fraser kelton" or "Nabeel hyatt"
export function normalizeSpeaker(name: string): string {
  const lowered = name.toLowerCase().trim();
  // Check if it starts with or equals "fraser" (handles "fraser", "fraser kelton", etc.)
  if (lowered === "fraser" || lowered.startsWith("fraser ")) return "Fraser";
  // Check if it starts with or equals "nabeel" (handles "nabeel", "nabeel hyatt", etc.)
  if (lowered === "nabeel" || lowered.startsWith("nabeel ")) return "Nabeel";
  // Capitalize first letter for any other speaker (guests)
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// Extract speaker from text, returns speaker and cleaned text
export function extractSpeaker(
  text: string,
  lastSpeaker: string
): { speaker: string; cleanText: string } {
  // Match patterns like "Fraser:", "nabeel:", "Guest Name:"
  const speakerMatch = text.match(/^([A-Za-z]+(?:\s+[A-Za-z]+)?):\s*/);

  if (speakerMatch) {
    const speaker = normalizeSpeaker(speakerMatch[1]);
    const cleanText = text.slice(speakerMatch[0].length).trim();
    return { speaker, cleanText };
  }

  // No speaker found, use last speaker
  return { speaker: lastSpeaker || "Unknown", cleanText: text.trim() };
}

// Check if a line is a section header (like "Cold Open" or "---")
function isSectionHeader(text: string): boolean {
  const trimmed = text.trim();
  // Skip lines that are just dashes
  if (/^-+$/.test(trimmed)) return true;
  // Skip common section headers (short lines without speaker labels)
  if (trimmed.length < 30 && !trimmed.includes(":") && !trimmed.includes(".")) {
    // Likely a section header like "Cold Open", "Intro", etc.
    return true;
  }
  return false;
}

// Main parser function
export function parseTransistorTranscript(
  content: string,
  episodeDuration?: number
): ParseResult {
  const errors: string[] = [];
  const speakerCounts: Record<string, number> = {};
  const segments: TranscriptSegment[] = [];

  // Find all timestamps and their positions
  const timestampRegex = /\[(\d{2}):(\d{2}):(\d{2})\]/g;
  const timestamps: { match: string; index: number; seconds: number }[] = [];

  let match;
  while ((match = timestampRegex.exec(content)) !== null) {
    timestamps.push({
      match: match[0],
      index: match.index,
      seconds: timestampToSeconds(match[0]),
    });
  }

  if (timestamps.length === 0) {
    errors.push("No timestamps found in transcript");
    return { segments: [], totalDuration: 0, speakerCounts, errors };
  }

  let lastSpeaker = "Fraser"; // Default to Fraser as primary host

  // Process each timestamp block
  for (let i = 0; i < timestamps.length; i++) {
    const current = timestamps[i];
    const next = timestamps[i + 1];

    // Extract content between this timestamp and the next (or end of file)
    const startPos = current.index + current.match.length;
    const endPos = next ? next.index : content.length;
    const blockContent = content.slice(startPos, endPos).trim();

    // Skip empty blocks
    if (!blockContent) continue;

    // Split into lines and process
    const lines = blockContent.split("\n").map((l) => l.trim()).filter((l) => l);

    // Collect all text from this block, skipping section headers
    const textParts: string[] = [];
    let blockSpeaker = "";

    for (const line of lines) {
      if (isSectionHeader(line)) continue;

      // Try to extract speaker from this line
      const { speaker, cleanText } = extractSpeaker(line, lastSpeaker);

      // If we found a speaker label, use it
      if (line.match(/^[A-Za-z]+(?:\s+[A-Za-z]+)?:\s*/)) {
        blockSpeaker = speaker;
        lastSpeaker = speaker;
      }

      if (cleanText) {
        textParts.push(cleanText);
      }
    }

    // Skip if no text content
    if (textParts.length === 0) continue;

    const fullText = textParts.join(" ").trim();
    const speaker = blockSpeaker || lastSpeaker;

    // Calculate end time
    let endTime: number;
    if (next) {
      endTime = next.seconds - 0.001; // Just before next segment starts
    } else {
      // Last segment: use episode duration or default +30s
      endTime = episodeDuration || current.seconds + 30;
    }

    // Guard against zero or negative duration (repeated timestamps)
    if (endTime <= current.seconds) {
      errors.push(`Skipped segment at ${current.seconds}s: invalid duration (endTime ${endTime})`);
      continue;
    }

    // Create segment
    const segment: TranscriptSegment = {
      speaker,
      text: fullText,
      startTime: current.seconds,
      endTime,
    };

    segments.push(segment);

    // Update speaker counts
    speakerCounts[speaker] = (speakerCounts[speaker] || 0) + 1;
  }

  // Calculate total duration
  const totalDuration =
    segments.length > 0
      ? segments[segments.length - 1].endTime
      : 0;

  return {
    segments,
    totalDuration,
    speakerCounts,
    errors,
  };
}
