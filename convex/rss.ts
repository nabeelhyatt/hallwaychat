"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const RSS_FEED_URL = "https://feeds.transistor.fm/hallway-chat";

export interface RSSEpisode {
  title: string;
  episodeNumber: number;
  audioUrl: string;
  transcriptUrl: string | null;
  chaptersUrl: string | null; // URL to chapters.json
  publishedAt: number; // Unix timestamp in ms
  duration: number; // seconds
  description: string;
  guid: string;
}

// Simple XML tag content extractor
function getTagContent(xml: string, tagName: string): string | null {
  // Handle namespaced tags like itunes:episode
  const escapedTag = tagName.replace(/:/g, "\\:");
  const regex = new RegExp(`<${escapedTag}[^>]*>([^<]*)</${escapedTag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

// Extract attribute from a tag
function getTagAttribute(
  xml: string,
  tagName: string,
  attrName: string
): string | null {
  const escapedTag = tagName.replace(/:/g, "\\:");
  const regex = new RegExp(`<${escapedTag}[^>]*${attrName}="([^"]*)"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

// Parse a single RSS item into an episode
function parseItem(itemXml: string): RSSEpisode | null {
  const title = getTagContent(itemXml, "title");
  if (!title) return null;

  // Episode number from itunes:episode or podcast:episode
  const episodeNumStr =
    getTagContent(itemXml, "itunes:episode") ||
    getTagContent(itemXml, "podcast:episode");
  const episodeNumber = episodeNumStr ? parseInt(episodeNumStr, 10) : 0;

  // Audio URL from enclosure
  const audioUrl = getTagAttribute(itemXml, "enclosure", "url") || "";

  // Transcript URL from podcast:transcript
  const transcriptUrl = getTagAttribute(itemXml, "podcast:transcript", "url");

  // Chapters URL from podcast:chapters
  const chaptersUrl = getTagAttribute(itemXml, "podcast:chapters", "url");

  // Duration from itunes:duration (can be seconds or HH:MM:SS)
  const durationStr = getTagContent(itemXml, "itunes:duration");
  let duration = 0;
  if (durationStr) {
    if (durationStr.includes(":")) {
      // HH:MM:SS or MM:SS format
      const parts = durationStr.split(":").map((p) => parseInt(p, 10));
      if (parts.length === 3) {
        duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        duration = parts[0] * 60 + parts[1];
      }
    } else {
      duration = parseInt(durationStr, 10);
    }
  }

  // Published date
  const pubDateStr = getTagContent(itemXml, "pubDate");
  const publishedAt = pubDateStr ? new Date(pubDateStr).getTime() : Date.now();

  // Description
  const description =
    getTagContent(itemXml, "description") ||
    getTagContent(itemXml, "itunes:summary") ||
    "";

  // GUID
  const guid = getTagContent(itemXml, "guid") || "";

  return {
    title,
    episodeNumber,
    audioUrl,
    transcriptUrl,
    chaptersUrl,
    publishedAt,
    duration,
    description,
    guid,
  };
}

// Fetch and parse the RSS feed
export const fetchRSSFeed = action({
  args: {},
  handler: async (): Promise<RSSEpisode[]> => {
    const response = await fetch(RSS_FEED_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const xml = await response.text();

    // Extract all <item> elements
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const episodes: RSSEpisode[] = [];

    let itemMatch;
    while ((itemMatch = itemRegex.exec(xml)) !== null) {
      const episode = parseItem(itemMatch[1]);
      if (episode) {
        episodes.push(episode);
      }
    }

    // Sort by episode number descending (newest first)
    episodes.sort((a, b) => b.episodeNumber - a.episodeNumber);

    return episodes;
  },
});

// Fetch transcript content from a URL
export const fetchTranscript = action({
  args: {
    transcriptUrl: v.string(),
  },
  handler: async (_, { transcriptUrl }): Promise<string> => {
    const response = await fetch(transcriptUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch transcript: ${response.status}`);
    }
    return await response.text();
  },
});
