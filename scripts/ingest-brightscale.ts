import * as cheerio from "cheerio";
import { createHash } from "crypto";
import { existsSync, readdirSync, readFileSync } from "fs";
import { basename, join } from "path";
import { runtimeConfig, siteConfig } from "@/lib/config";
import { createEmbedding } from "@/lib/rag";
import { getSupabaseAdmin } from "@/lib/supabase";

type PageDocument = {
  title: string;
  url: string;
  text: string;
};

const DEFAULT_SEEDS = [
  "https://brightscale.us",
  "https://brightscale.us/products/voice",
  "https://brightscale.us/products/social-media",
  "https://brightscale.us/products/sms-email",
  "https://brightscale.us/services/meta-ads",
  "https://brightscale.us/services/ai-automation"
];

const FALLBACK_KNOWLEDGE = [
  {
    title: "Brightscale Services Overview",
    url: "https://brightscale.us",
    text:
      "Brightscale provides AI automation solutions for small and medium-sized businesses. Brightscale specializes in AI voice agents, AI SMS and email messaging agents, AI social media agents, Meta ads services, lead generation, CRM workflows, and automation systems that help businesses respond faster and convert more leads. Brightscale encourages visitors to book a free consultation."
  },
  {
    title: "Brightscale Solution Routing",
    url: "https://brightscale.us",
    text:
      "Brightscale can recommend AI SMS and voice agents for restaurants, voice agents and lead follow-up for med spas, AI lead qualification for real estate teams, and social media automation for ecommerce businesses. Brightscale should not invent pricing or unsupported features."
  }
];

const KNOWLEDGE_DIR = "knowledge";

function normalizeUrl(input: string) {
  const url = new URL(input, siteConfig.siteUrl);
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function isBrightscaleUrl(input: string) {
  try {
    const url = new URL(input, siteConfig.siteUrl);
    return url.hostname === "brightscale.us" || url.hostname === "www.brightscale.us";
  } catch {
    return false;
  }
}

function shouldCrawl(input: string) {
  const url = new URL(input, siteConfig.siteUrl);
  const path = url.pathname.toLowerCase();
  return (
    path === "/" ||
    path.includes("product") ||
    path.includes("service") ||
    path.includes("automation") ||
    path.includes("agent") ||
    path.includes("ads")
  );
}

async function fetchPage(url: string): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "BrightscaleKnowledgeIngest/1.0"
      }
    });

    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
      return null;
    }

    return {
      html: await response.text(),
      finalUrl: normalizeUrl(response.url)
    };
  } catch {
    return null;
  }
}

function extractText(html: string, url: string): PageDocument {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, iframe, nav, footer").remove();

  const title =
    $("meta[property='og:title']").attr("content") ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "Brightscale";

  const text = $("body")
    .text()
    .replace(/\s+/g, " ")
    .replace(/Cookie Policy|Privacy Policy/gi, "")
    .trim();

  return {
    title,
    url,
    text
  };
}

function extractLinks(html: string, baseUrl: string) {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    const absolute = normalizeUrl(new URL(href, baseUrl).toString());
    if (isBrightscaleUrl(absolute) && shouldCrawl(absolute)) {
      links.add(absolute);
    }
  });

    return Array.from(links);
}

function chunkText(text: string, maxChars = 1400, overlap = 180) {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 180) chunks.push(chunk);
    start = end - overlap;
    if (start < 0 || end === text.length) break;
  }

  return chunks;
}

function readKnowledgeFiles(): PageDocument[] {
  const directory = join(process.cwd(), KNOWLEDGE_DIR);
  if (!existsSync(directory)) return [];

  return readdirSync(directory)
    .filter((fileName) => /\.(md|txt)$/i.test(fileName))
    .map((fileName) => {
      const filePath = join(directory, fileName);
      const raw = readFileSync(filePath, "utf8")
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      const title =
        raw.match(/^#\s+(.+)$/m)?.[1]?.trim() ||
        basename(fileName).replace(/\.(md|txt)$/i, "").replace(/[-_]/g, " ");

      return {
        title,
        url: `internal://brightscale-knowledge/${fileName}`,
        text: raw
      };
    })
    .filter((document) => document.text.length > 100);
}

async function crawl(seedUrls: string[]) {
  const queue = seedUrls.map(normalizeUrl);
  const seen = new Set<string>();
  const pages: PageDocument[] = [];

  while (queue.length > 0 && seen.size < 30) {
    const url = queue.shift();
    if (!url || seen.has(url) || !isBrightscaleUrl(url)) continue;
    seen.add(url);

    const page = await fetchPage(url);
    if (!page) continue;

    const document = extractText(page.html, page.finalUrl);
    if (document.text.length > 200) pages.push(document);

    for (const link of extractLinks(page.html, page.finalUrl)) {
      if (!seen.has(link) && !queue.includes(link)) queue.push(link);
    }
  }

  return pages.length > 0 ? pages : FALLBACK_KNOWLEDGE;
}

export async function ingestBrightscaleKnowledge(urls = DEFAULT_SEEDS) {
  if (!runtimeConfig.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is required for embeddings.");
  }

  const supabase = getSupabaseAdmin();
  const pages = [...readKnowledgeFiles(), ...(await crawl(urls))];
  const rows = [];
  const seenContentHashes = new Set<string>();

  for (const page of pages) {
    const chunks = chunkText(page.text);

    for (let index = 0; index < chunks.length; index += 1) {
      const content = chunks[index];
      const contentHash = createHash("sha256")
        .update(`${page.url}:${index}:${content}`)
        .digest("hex");

      if (seenContentHashes.has(contentHash)) {
        continue;
      }

      seenContentHashes.add(contentHash);
      const embedding = await createEmbedding(content);

      rows.push({
        content_hash: contentHash,
        title: page.title,
        url: page.url,
        content,
        chunk_index: index,
        embedding,
        updated_at: new Date().toISOString()
      });
    }
  }

  if (rows.length === 0) {
    return { pages: pages.length, chunks: 0 };
  }

  const { error } = await supabase.from("documents").upsert(rows, {
    onConflict: "content_hash"
  });

  if (error) throw error;

  return {
    pages: pages.length,
    chunks: rows.length,
    urls: pages.map((page) => page.url)
  };
}

if (process.argv[1]?.includes("ingest-brightscale")) {
  ingestBrightscaleKnowledge()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
