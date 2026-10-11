import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getStudentRecord } from "@/lib/aws/dynamodb";
import { getTopic } from "@/config/topics";
import { invokeBedrockText } from "@/lib/aws/bedrock";
import { LANGUAGE_COOKIE, resolveLanguage, getTopicTitle } from "@/lib/i18n";

export type StudentRecommendationResponse = {
  studentId: string;
  language: "en" | "hi";
  weakTopics: Array<{
    slug: string;
    title: string;
    score: number;
    attempts: number;
  }>;
  recommendation: string;
  suggestedAction: {
    topicSlug: string;
    title: string;
    action: "start" | "review" | "practice";
    href: string;
  } | null;
};

const SYSTEM_EN = `You are a warm, encouraging DSA learning coach for Indian high-school students (Class 10–12).
Given a student's weak topics and their scores, write a short (2–3 sentences max) personalised study recommendation.
Be specific about which topic to tackle first and why. End with one concrete action they can take right now.
Plain text only — no markdown, no bullet points.`;

const SYSTEM_HI = `आप कक्षा 10–12 के भारतीय छात्रों के लिए एक उत्साहवर्धक DSA लर्निंग कोच हैं।
छात्र के कमजोर विषयों और उनके स्कोर को देखकर 2–3 वाक्यों में व्यक्तिगत अध्ययन सुझाव दें।
स्पष्ट रूप से बताएं कि पहले किस विषय से शुरुआत करनी चाहिए और क्यों। अंत में एक ठोस अगला कदम बताएं।
केवल सादा पाठ (plain text) लिखें — कोई markdown या बुलेट पॉइंट नहीं।`;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const studentId = decodeURIComponent(id).trim().toLowerCase();

  if (!studentId) {
    return NextResponse.json(
      { error: "studentId is required" },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const cookieStore = await cookies();
  const record = await getStudentRecord(studentId);

  const language = resolveLanguage(
    searchParams.get("language"),
    cookieStore.get(LANGUAGE_COOKIE)?.value,
    record?.language,
  );
  const isHindi = language === "hi";

  // ── New student or no attempts yet ────────────────────────────────────────
  if (!record || Object.keys(record.topics).length === 0) {
    const firstTopicTitle = getTopicTitle("arrays", language);
    return NextResponse.json<StudentRecommendationResponse>({
      studentId,
      language,
      weakTopics: [],
      recommendation: isHindi
        ? `bodh में आपका स्वागत है! ${firstTopicTitle} से शुरुआत करें — यह सबसे बुनियादी डेटा स्ट्रक्चर है और आगे के सभी विषयों को आसान बनाता है।`
        : "Welcome to bodh! Start with Arrays — it's the foundation every other data structure builds on. Read the short article and try the 5-question quiz to see where you stand.",
      suggestedAction: {
        topicSlug: "arrays",
        title: firstTopicTitle,
        action: "start",
        href: `/learn/arrays?language=${language}`,
      },
    });
  }

  // ── Enrich weakTopics with titles + scores ─────────────────────────────────
  const weakDetails = record.weakTopics.map((slug) => {
    const perf = record.topics[slug] ?? { score: 0, attempts: 0 };
    return {
      slug,
      title: getTopicTitle(slug, language) || getTopic(slug)?.title || slug,
      score: perf.score,
      attempts: perf.attempts,
    };
  });

  // ── All attempted topics are strong (≥ 60) ────────────────────────────────
  if (weakDetails.length === 0) {
    const allSlugs = [
      "arrays",
      "linked-list",
      "stacks",
      "queues",
      "binary-search",
      "recursion",
    ];
    const untried = allSlugs.find((s) => !record.topics[s]);
    const nextSlug = untried ?? allSlugs[0];
    const nextTitle = getTopicTitle(nextSlug, language) || getTopic(nextSlug)?.title || nextSlug;

    return NextResponse.json<StudentRecommendationResponse>({
      studentId,
      language,
      weakTopics: [],
      recommendation: untried
        ? isHindi
          ? `अब तक के विषयों में आपका प्रदर्शन शानदार है! अपनी गति बनाए रखने के लिए अब ${nextTitle} शुरू करें।`
          : `Great work on the topics you've covered so far! Ready for the next challenge? Dive into ${nextTitle} to keep your momentum going.`
        : isHindi
          ? "बधाई हो — आपने सभी मुख्य विषयों में 60% से अधिक समझ हासिल कर ली है! अपने सबसे कम स्कोर वाले विषय का अभ्यास करके उसे 100% तक ले जाएं।"
          : "Impressive — you've scored 60% or above on every topic! Pick any topic and try the Interview teaching style to sharpen your problem-solving edge.",
      suggestedAction: {
        topicSlug: nextSlug,
        title: nextTitle,
        action: untried ? "start" : "practice",
        href: `/learn/${nextSlug}?language=${language}`,
      },
    });
  }

  // ── Build prompt from weak topics ─────────────────────────────────────────
  const summaryLines = weakDetails
    .map((w) => `- ${w.title}: ${w.score}% (${w.attempts} attempt${w.attempts === 1 ? "" : "s"})`)
    .join("\n");

  const userPrompt = isHindi
    ? `छात्र के कमजोर विषय (सबसे कम स्कोर पहले):\n${summaryLines}\n\nछात्र के लिए हिंदी में संक्षिप्त और उत्साहवर्धक अध्ययन सुझाव लिखें।`
    : `Student's weak topics (lowest score first):\n${summaryLines}\n\nGive a short, encouraging recommendation on what to study next.`;

  const coldest = weakDetails[0];
  let recommendationText: string;

  try {
    const raw = await invokeBedrockText(
      isHindi ? SYSTEM_HI : SYSTEM_EN,
      userPrompt,
      { maxTokens: 180, temperature: 0.4 },
    );

    recommendationText = raw.startsWith("[local]")
      ? buildFallbackRecommendation(coldest, language)
      : raw.trim();
  } catch {
    recommendationText = buildFallbackRecommendation(coldest, language);
  }

  return NextResponse.json<StudentRecommendationResponse>({
    studentId,
    language,
    weakTopics: weakDetails,
    recommendation: recommendationText,
    suggestedAction: {
      topicSlug: coldest.slug,
      title: coldest.title,
      action: coldest.score === 0 ? "start" : "review",
      href: `/learn/${coldest.slug}?language=${language}`,
    },
  });
}

function buildFallbackRecommendation(
  coldest: { slug: string; title: string; score: number; attempts: number },
  language: "en" | "hi",
): string {
  if (language === "hi") {
    if (coldest.score === 0) {
      return `${coldest.title} से शुरुआत करें — पहले संक्षिप्त पाठ पढ़ें और फिर 5 प्रश्नों का क्विज़ हल करके अपनी समझ जाँचें।`;
    }
    return `आपका ${coldest.title} स्कोर ${coldest.score}% है (${coldest.attempts} प्रयास)। मुख्य अवधारणा को एक बार फिर पढ़ें और अलग तरीके से समझें (Explain Differently) का उपयोग करें।`;
  }
  if (coldest.score === 0) {
    return `Start with ${coldest.title} — you haven't completed a quiz on it yet. Read the lesson article first, then take the 5-question quiz to set your baseline score.`;
  }
  return `Focus on ${coldest.title} next, where your best score is ${coldest.score}% after ${coldest.attempts} attempt${coldest.attempts === 1 ? "" : "s"}. Re-read the key sections, use "Explain Differently" in Visual or Simple mode, then retake the quiz to push past 60%.`;
}
