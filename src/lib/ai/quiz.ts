import { SignJWT, jwtVerify } from "jose";
import type {
  GradedQuestionResult,
  PublicQuizQuestion,
  QuizQuestion,
} from "@/types/quiz";
import type { LanguageCode } from "@/config/languages";
import { invokeBedrockJSON } from "@/lib/aws/bedrock";
import { PROMPTS } from "@/lib/ai/prompts";
import {
  getLessonContent,
  getTopicLearningObjectives,
} from "@/lib/learning/content";
import { getEnv } from "@/config/env";

// ── Server-side quiz session store + signed token for authoritative grading ──

const quizSessionCache = new Map<
  string,
  {
    topicSlug: string;
    language: "en" | "hi";
    questions: QuizQuestion[];
    createdAt: number;
  }
>();

function getQuizSecret(): Uint8Array {
  const raw =
    getEnv("AUTH_SECRET") ||
    getEnv("JWT_SECRET") ||
    "bodh-phase3-quiz-signing-secret-key-2026";
  return new TextEncoder().encode(raw);
}

/**
 * Strips answer keys and explanations before sending questions to the client.
 */
export function toPublicQuestions(
  questions: QuizQuestion[],
): PublicQuizQuestion[] {
  return questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: q.options.slice(0, 4),
    concept: q.concept,
  }));
}

/**
 * Creates a server-side quiz session token containing the authoritative
 * question set and answer keys so client submissions cannot tamper with answers.
 */
export async function createQuizSessionToken(
  topicSlug: string,
  language: "en" | "hi",
  questions: QuizQuestion[],
): Promise<string> {
  const sessionId = `qz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  quizSessionCache.set(sessionId, {
    topicSlug,
    language,
    questions,
    createdAt: Date.now(),
  });

  // Prune old cache entries (> 1 hour)
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [k, v] of quizSessionCache.entries()) {
    if (v.createdAt < cutoff) quizSessionCache.delete(k);
  }

  return new SignJWT({
    sid: sessionId,
    topicSlug,
    language,
    questions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(getQuizSecret());
}

/**
 * Resolves authoritative questions from a quizToken, cache, or deterministic pool.
 */
export async function resolveAuthoritativeQuestions(
  topicSlug: string,
  language: "en" | "hi",
  quizToken?: string,
  clientQuestions?: unknown,
): Promise<QuizQuestion[]> {
  if (quizToken) {
    try {
      const { payload } = await jwtVerify(quizToken, getQuizSecret());
      const sid = typeof payload.sid === "string" ? payload.sid : "";
      if (sid && quizSessionCache.has(sid)) {
        return quizSessionCache.get(sid)!.questions;
      }
      if (Array.isArray(payload.questions) && payload.questions.length > 0) {
        return payload.questions as QuizQuestion[];
      }
    } catch (err) {
      console.warn("[quiz] Invalid or expired quizToken, resolving from pool:", err);
    }
  }

  // Match client question IDs against verified topic pool first
  const pool = getTopicQuestionPool(topicSlug, language);
  const poolById = new Map(pool.map((q) => [q.id, q]));

  if (Array.isArray(clientQuestions) && clientQuestions.length > 0) {
    const matched: QuizQuestion[] = [];
    for (const cq of clientQuestions) {
      if (!cq || typeof cq !== "object") continue;
      const qObj = cq as Partial<QuizQuestion>;
      if (qObj.id && poolById.has(qObj.id)) {
        matched.push(poolById.get(qObj.id)!);
      } else if (
        typeof qObj.id === "string" &&
        typeof qObj.prompt === "string" &&
        Array.isArray(qObj.options) &&
        qObj.options.length === 4 &&
        typeof qObj.answer === "number" &&
        qObj.answer >= 0 &&
        qObj.answer < 4
      ) {
        matched.push({
          id: qObj.id,
          prompt: qObj.prompt,
          options: qObj.options.map(String),
          answer: qObj.answer,
          explanation:
            typeof qObj.explanation === "string" ? qObj.explanation : "",
          concept:
            typeof qObj.concept === "string" && qObj.concept
              ? qObj.concept
              : "core concept",
        });
      }
    }
    if (matched.length > 0) return matched;
  }

  return pool.slice(0, 5);
}

/**
 * Authoritative server-side grading of submitted answers against verified questions.
 */
export function gradeQuizSubmission(
  questions: QuizQuestion[],
  answers: number[],
): {
  score: number;
  correct: number;
  total: number;
  missedConcepts: string[];
  masteredConcepts: string[];
  gradedQuestions: GradedQuestionResult[];
} {
  const total = questions.length;
  let correct = 0;
  const missedSet = new Set<string>();
  const masteredSet = new Set<string>();

  const gradedQuestions: GradedQuestionResult[] = questions.map((q, idx) => {
    const selectedAnswer =
      typeof answers[idx] === "number" && Number.isInteger(answers[idx])
        ? answers[idx]
        : -1;
    const isCorrect = selectedAnswer === q.answer;
    if (isCorrect) {
      correct += 1;
      if (q.concept) masteredSet.add(q.concept);
    } else if (q.concept) {
      missedSet.add(q.concept);
    }

    return {
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      selectedAnswer,
      correctAnswer: q.answer,
      isCorrect,
      explanation: q.explanation,
      concept: q.concept || "core concept",
    };
  });

  // If a concept was missed on one question, don't mark it mastered in the same attempt
  for (const m of missedSet) {
    masteredSet.delete(m);
  }

  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  return {
    score,
    correct,
    total,
    missedConcepts: Array.from(missedSet),
    masteredConcepts: Array.from(masteredSet),
    gradedQuestions,
  };
}

// ── Verified Topic-Specific Bilingual Question Pools ─────────────────────────

const TOPIC_QUIZ_POOLS: Record<
  string,
  { en: QuizQuestion[]; hi: QuizQuestion[] }
> = {
  arrays: {
    en: [
      {
        id: "arrays-1",
        prompt: "Why does reading an element at index i in an array take O(1) time?",
        options: [
          "Elements are stored in contiguous memory, so the address of index i is computed directly",
          "The array searches from index 0 very quickly using hardware",
          "Arrays automatically keep elements sorted in ascending order",
          "Each element stores a pointer to the next element",
        ],
        answer: 0,
        explanation: "Contiguous memory allows direct address calculation: base_address + i * element_size.",
        concept: "index access",
      },
      {
        id: "arrays-2",
        prompt: "What happens in memory when you insert a new item at index 0 of an array with n elements?",
        options: [
          "All n existing elements must shift one position to the right, taking O(n) time",
          "Only the first element moves to the end of the array in O(1) time",
          "A new pointer is attached to the head without moving any elements",
          "The array reverses itself automatically",
        ],
        answer: 0,
        explanation: "Inserting at the front requires shifting all existing elements to preserve contiguous order.",
        concept: "middle insertion cost",
      },
      {
        id: "arrays-3",
        prompt: "In a 0-indexed array of length 6, what is the index of the last element?",
        options: ["5", "6", "1", "0"],
        answer: 0,
        explanation: "Because indexing starts at 0, an array of length n has valid indices from 0 to n - 1.",
        concept: "index bounds",
      },
      {
        id: "arrays-4",
        prompt: "Which scenario is best suited for a fixed-size array rather than a linked list?",
        options: [
          "Frequently reading random elements by their position number",
          "Inserting thousands of items at the very beginning every second",
          "Storing an unpredictable number of items without ever resizing",
          "Removing elements from the middle without shifting memory",
        ],
        answer: 0,
        explanation: "Arrays excel at O(1) random access by index when size is known or stable.",
        concept: "contiguous memory trade-offs",
      },
      {
        id: "arrays-5",
        prompt: "What is the time complexity of finding whether an unsorted array of n numbers contains the value 42?",
        options: [
          "O(n), because you may need to check every element in the worst case",
          "O(1), because arrays have instant value lookup",
          "O(log n), because you can always binary search an unsorted array",
          "O(n²), because every pair must be compared",
        ],
        answer: 0,
        explanation: "Without sorting or an index, linear scan checks up to n elements.",
        concept: "linear scan complexity",
      },
      {
        id: "arrays-retest-1",
        prompt: "If an array starts at memory address 2000 and each integer takes 4 bytes, why can the CPU jump straight to arr[3] without checking arr[0], arr[1], or arr[2]?",
        options: [
          "It calculates 2000 + (3 × 4) = 2012 directly using contiguous layout",
          "It follows three next-pointers in parallel",
          "It uses binary search on the memory addresses",
          "It caches only index 3 in a special register",
        ],
        answer: 0,
        explanation: "Direct arithmetic on the base address is why array indexing is O(1).",
        concept: "index access",
      },
    ],
    hi: [
      {
        id: "arrays-1",
        prompt: "Array में किसी index i पर रखे तत्व को पढ़ने में O(1) समय क्यों लगता है?",
        options: [
          "तत्व लगातार (contiguous) मेमोरी में होते हैं, इसलिए पता सीधे गणना से मिल जाता है",
          "कंप्यूटर 0 से i तक बहुत तेज़ी से गिनती करता है",
          "Array हमेशा अपने आप sorted रहता है",
          "हर तत्व अगले तत्व का pointer रखता है",
        ],
        answer: 0,
        explanation: "लगातार मेमोरी के कारण base_address + i * size से सीधा पता निकल आता है।",
        concept: "index access",
      },
      {
        id: "arrays-2",
        prompt: "n तत्वों वाले Array के index 0 पर नया तत्व जोड़ने पर मेमोरी में क्या होता है?",
        options: [
          "सभी n मौजूदा तत्वों को एक स्थान दाएँ खिसकाना पड़ता है, जिसमें O(n) समय लगता है",
          "केवल पहला तत्व अंत में चला जाता है (O(1) समय)",
          "बिना किसी तत्व को हिलाए नया pointer जुड़ जाता है",
          "Array का आकार आधा हो जाता है",
        ],
        answer: 0,
        explanation: "क्रम बनाए रखने के लिए सभी तत्वों को shift करना पड़ता है।",
        concept: "middle insertion cost",
      },
      {
        id: "arrays-3",
        prompt: "6 लंबाई वाले 0-indexed Array में अंतिम तत्व का index क्या होगा?",
        options: ["5", "6", "1", "0"],
        answer: 0,
        explanation: "0 से गिनती शुरू होने के कारण n लंबाई वाले array का अंतिम index n - 1 होता है।",
        concept: "index bounds",
      },
      {
        id: "arrays-4",
        prompt: "Linked List की तुलना में Array का उपयोग कब सबसे बेहतर होता है?",
        options: [
          "जब बार-बार किसी index नंबर से सीधे तत्व को पढ़ना हो",
          "जब हर सेकंड शुरुआत में हज़ारों नए तत्व जोड़ने हों",
          "जब बिना शिफ्टिंग के बीच से तत्व हटाने हों",
          "जब मेमोरी में लगातार जगह उपलब्ध न हो",
        ],
        answer: 0,
        explanation: "Array की मुख्य ताकत O(1) random index lookup है।",
        concept: "contiguous memory trade-offs",
      },
      {
        id: "arrays-5",
        prompt: "एक बिना सॉर्ट किए (unsorted) Array में किसी संख्या को खोजने की सबसे खराब स्थिति (worst-case) की time complexity क्या है?",
        options: [
          "O(n), क्योंकि हर तत्व को जाँचना पड़ सकता है",
          "O(1), क्योंकि Array में सब कुछ तुरंत मिलता है",
          "O(log n), क्योंकि हम सीधे Binary Search लगा सकते हैं",
          "O(n²), क्योंकि दोहरे लूप की ज़रूरत होती है",
        ],
        answer: 0,
        explanation: "Unsorted डेटा में तत्व अंत में हो सकता है या मौजूद न हो, इसलिए O(n) जांच लगती है।",
        concept: "linear scan complexity",
      },
      {
        id: "arrays-retest-1",
        prompt: "यदि Array मेमोरी पता 2000 से शुरू होता है और हर संख्या 4 बाइट लेती है, तो CPU बिना arr[0..2] देखे सीधे arr[3] तक कैसे पहुँचता है?",
        options: [
          "यह लगातार मेमोरी के कारण सीधे 2000 + (3 × 4) = 2012 की गणना करता है",
          "यह तीन पॉइंटर्स को एक साथ फॉलो करता है",
          "यह मेमोरी पर बाइनरी सर्च लगाता है",
          "यह केवल तीसरे तत्व को अलग रखता है",
        ],
        answer: 0,
        explanation: "सीधे पते की गणना के कारण ही इंडेक्स एक्सेस O(1) होता है।",
        concept: "index access",
      },
    ],
  },
  "linked-list": {
    en: [
      {
        id: "linked-list-1",
        prompt: "Why does finding the k-th element in a singly linked list take O(k) time?",
        options: [
          "Nodes are scattered in memory, so you must follow next pointers from the head one by one",
          "Linked lists sort themselves on every read operation",
          "Each node is compressed and must be decoded",
          "The head pointer only points to the last node",
        ],
        answer: 0,
        explanation: "Without contiguous indices, reaching node k requires traversing k links from head.",
        concept: "pointer traversal",
      },
      {
        id: "linked-list-2",
        prompt: "How fast is inserting a new node at the head of a singly linked list?",
        options: [
          "O(1), by setting newNode.next = head and updating head = newNode",
          "O(n), because all subsequent nodes must shift in memory",
          "O(log n), using binary pointer jumping",
          "O(n²), because every pointer must be renumbered",
        ],
        answer: 0,
        explanation: "Head insertion only updates two pointer references regardless of list length.",
        concept: "head insertion",
      },
      {
        id: "linked-list-3",
        prompt: "When inserting newNode after currentNode in a singly linked list, why must you set newNode.next = currentNode.next BEFORE setting currentNode.next = newNode?",
        options: [
          "Overwriting currentNode.next first loses the reference to the rest of the list",
          "The compiler rejects assignments in any other order",
          "It keeps the memory addresses sorted",
          "Otherwise newNode becomes the head of the list",
        ],
        answer: 0,
        explanation: "If currentNode.next is overwritten first, the pointer to the remaining chain is lost.",
        concept: "pointer reassignment order",
      },
      {
        id: "linked-list-4",
        prompt: "What does the last node's next pointer hold in a standard singly linked list?",
        options: [
          "null (or None), marking the end of the chain",
          "The memory address of index 0",
          "The total count of nodes in the list",
          "A pointer back to itself",
        ],
        answer: 0,
        explanation: "A null next pointer signals that traversal has reached the tail.",
        concept: "tail termination",
      },
      {
        id: "linked-list-5",
        prompt: "Compared to an array of the same elements, why does a linked list use slightly more memory per element?",
        options: [
          "Every node stores an extra pointer reference alongside its data value",
          "Linked lists duplicate every data value twice",
          "Linked lists pre-allocate 1000 empty slots",
          "Each node stores the entire list length",
        ],
        answer: 0,
        explanation: "Each node carries pointer overhead in addition to the payload.",
        concept: "memory overhead",
      },
    ],
    hi: [
      {
        id: "linked-list-1",
        prompt: "Singly Linked List में k-वें नोड तक पहुँचने में O(k) समय क्यों लगता है?",
        options: [
          "नोड्स मेमोरी में अलग-अलग होते हैं, इसलिए head से एक-एक कर next pointer फॉलो करना पड़ता है",
          "Linked List हर बार डेटा को सॉर्ट करती है",
          "हर नोड का डेटा एन्क्रिप्टेड होता है",
          "head pointer केवल अंतिम नोड को जानता है",
        ],
        answer: 0,
        explanation: "लगातार इंडेक्स न होने के कारण head से क्रमवार चलना पड़ता है।",
        concept: "pointer traversal",
      },
      {
        id: "linked-list-2",
        prompt: "Singly Linked List के head (शुरुआत) में नया नोड जोड़ने की time complexity क्या है?",
        options: [
          "O(1), केवल newNode.next = head और head = newNode सेट करके",
          "O(n), क्योंकि बाकी सभी नोड्स को खिसकाना पड़ता है",
          "O(log n), आधे नोड्स को छोड़कर",
          "O(n²), क्योंकि सभी पॉइंटर्स बदलने पड़ते हैं",
        ],
        answer: 0,
        explanation: "शुरुआत में जोड़ने के लिए केवल दो पॉइंटर बदलने होते हैं।",
        concept: "head insertion",
      },
      {
        id: "linked-list-3",
        prompt: "currentNode के बाद newNode जोड़ते समय currentNode.next = newNode करने से पहले newNode.next = currentNode.next करना क्यों ज़रूरी है?",
        options: [
          "पहले currentNode.next बदल देने से आगे की पूरी लिस्ट का पता (reference) खो जाएगा",
          "ऐसा न करने पर सिंटैक्स एरर आती है",
          "इससे लिस्ट अपने आप सॉर्ट हो जाती है",
          "अन्यथा newNode लिस्ट से बाहर हो जाएगा",
        ],
        answer: 0,
        explanation: "आगे की चेन को सुरक्षित रखने के लिए पहले नए नोड को आगे के नोड से जोड़ना आवश्यक है।",
        concept: "pointer reassignment order",
      },
      {
        id: "linked-list-4",
        prompt: "एक सामान्य Singly Linked List के अंतिम नोड का next पॉइंटर क्या दर्शाता है?",
        options: [
          "null (या None), जो बताता है कि श्रृंखला समाप्त हो गई है",
          "पहले नोड का पता",
          "लिस्ट की कुल लंबाई",
          "उसी नोड का अपना पता",
        ],
        answer: 0,
        explanation: "अंतिम नोड का next = null यह संकेत देता है कि इसके आगे कोई नोड नहीं है।",
        concept: "tail termination",
      },
      {
        id: "linked-list-5",
        prompt: "समान तत्वों वाले Array की तुलना में Linked List प्रति तत्व थोड़ी अधिक मेमोरी क्यों लेती है?",
        options: [
          "क्योंकि हर नोड डेटा के साथ अगले नोड का pointer भी स्टोर करता है",
          "क्योंकि हर संख्या दो बार लिखी जाती है",
          "क्योंकि यह हमेशा 100 खाली नोड्स बनाती है",
          "क्योंकि हर नोड में पूरी लिस्ट की कॉपी होती है",
        ],
        answer: 0,
        explanation: "डेटा के अलावा next पॉइंटर रखने के लिए अतिरिक्त मेमोरी लगती है।",
        concept: "memory overhead",
      },
    ],
  },
  stacks: {
    en: [
      {
        id: "stacks-1",
        prompt: "If you push 10, then 20, then 30 onto an empty stack, what value does a single pop() return?",
        options: ["30", "10", "20", "0"],
        answer: 0,
        explanation: "A stack follows Last-In, First-Out (LIFO): 30 was pushed last, so it comes out first.",
        concept: "LIFO ordering",
      },
      {
        id: "stacks-2",
        prompt: "What is the difference between pop() and peek() on a stack?",
        options: [
          "pop() removes and returns the top item, while peek() reads the top item without removing it",
          "peek() removes the bottom item, while pop() removes the top item",
          "pop() takes O(n) time, while peek() takes O(1) time",
          "peek() reverses the stack order",
        ],
        answer: 0,
        explanation: "peek() inspects the top element non-destructively; pop() removes it.",
        concept: "push pop peek operations",
      },
      {
        id: "stacks-3",
        prompt: "Why is a stack ideal for checking balanced parentheses like '({[]})'?",
        options: [
          "The most recently opened bracket must be closed first, matching LIFO order",
          "Brackets must be processed in alphabetical order",
          "A stack automatically sorts opening and closing brackets",
          "It checks all brackets in O(1) total time regardless of string length",
        ],
        answer: 0,
        explanation: "Nested structures close in the exact reverse order they were opened — a classic LIFO pattern.",
        concept: "nested matching with stacks",
      },
      {
        id: "stacks-4",
        prompt: "What happens if you call pop() on an empty stack?",
        options: [
          "A stack underflow error (or empty indicator) occurs because there is no element to remove",
          "It automatically returns 0 without changing anything",
          "It waits forever for a new item",
          "It deletes the stack variable from memory",
        ],
        answer: 0,
        explanation: "Always check isEmpty() before popping to avoid stack underflow.",
        concept: "empty stack boundary",
      },
      {
        id: "stacks-5",
        prompt: "What is the time complexity of pushing and popping at the top of a properly implemented stack?",
        options: [
          "O(1) for both push and pop",
          "O(n) for push and O(1) for pop",
          "O(log n) for both operations",
          "O(n) because all elements shift on every push",
        ],
        answer: 0,
        explanation: "Both operations only touch the top pointer or array end, running in constant O(1) time.",
        concept: "stack time complexity",
      },
    ],
    hi: [
      {
        id: "stacks-1",
        prompt: "यदि आप खाली Stack में क्रमशः 10, 20 और 30 push करते हैं, तो एक बार pop() करने पर क्या मिलेगा?",
        options: ["30", "10", "20", "0"],
        answer: 0,
        explanation: "Stack में Last-In, First-Out (LIFO) नियम चलता है — 30 सबसे अंत में गया था, इसलिए सबसे पहले निकलेगा।",
        concept: "LIFO ordering",
      },
      {
        id: "stacks-2",
        prompt: "Stack में pop() और peek() के बीच क्या अंतर है?",
        options: [
          "pop() शीर्ष तत्व को हटाकर लौटाता है, जबकि peek() बिना हटाए केवल उसे देखता है",
          "peek() सबसे नीचे का तत्व हटाता है",
          "pop() में O(n) समय लगता है और peek() में O(1)",
          "peek() पूरे स्टैक को उल्टा कर देता है",
        ],
        answer: 0,
        explanation: "peek() केवल top तत्व को पढ़ता है, उसे हटाता नहीं।",
        concept: "push pop peek operations",
      },
      {
        id: "stacks-3",
        prompt: "'({[]})' जैसे संतुलित ब्रैकेट्स (balanced parentheses) की जाँच के लिए Stack सबसे उपयुक्त क्यों है?",
        options: [
          "जो ब्रैकेट सबसे अंत में खुला है, वह सबसे पहले बंद होना चाहिए — जो LIFO नियम से मेल खाता है",
          "Stack सभी ब्रैकेट्स को वर्णमाला क्रम में लगा देता है",
          "इसमें किसी लूप की ज़रूरत नहीं पड़ती",
          "यह केवल गोल ब्रैकेट्स को गिनता है",
        ],
        answer: 0,
        explanation: "अंदरूनी ब्रैकेट सबसे पहले बंद होता है, जो LIFO पैटर्न का सीधा उदाहरण है।",
        concept: "nested matching with stacks",
      },
      {
        id: "stacks-4",
        prompt: "खाली Stack पर pop() चलाने से क्या समस्या होती है?",
        options: [
          "Stack underflow (खाली स्टैक त्रुटि), क्योंकि हटाने के लिए कोई तत्व मौजूद नहीं है",
          "यह हमेशा 100 लौटाता है",
          "यह स्टैक का आकार दोगुना कर देता है",
          "कुछ नहीं होता",
        ],
        answer: 0,
        explanation: "pop() से पहले हमेशा यह जाँचना चाहिए कि स्टैक खाली (isEmpty) तो नहीं है।",
        concept: "empty stack boundary",
      },
      {
        id: "stacks-5",
        prompt: "सही तरीके से बनाए गए Stack में push और pop की time complexity क्या होती है?",
        options: [
          "दोनों के लिए O(1)",
          "push के लिए O(n) और pop के लिए O(1)",
          "दोनों के लिए O(log n)",
          "O(n), क्योंकि हर बार सारे तत्व खिसकते हैं",
        ],
        answer: 0,
        explanation: "केवल शीर्ष (top) पर काम होने के कारण दोनों ऑपरेशन्स O(1) समय लेते हैं।",
        concept: "stack time complexity",
      },
    ],
  },
  queues: {
    en: [
      {
        id: "queues-1",
        prompt: "If items A, B, and C are enqueued into an empty queue in that order, which item is dequeued first?",
        options: [
          "A, because a queue follows First-In, First-Out (FIFO) order",
          "C, because it was added most recently",
          "B, because it is in the middle",
          "All three are removed together",
        ],
        answer: 0,
        explanation: "FIFO preserves arrival order: the first item in (A) is the first item out.",
        concept: "FIFO ordering",
      },
      {
        id: "queues-2",
        prompt: "At which ends of a queue do enqueue and dequeue happen?",
        options: [
          "Enqueue adds to the back (rear/tail) and dequeue removes from the front (head)",
          "Both enqueue and dequeue happen only at the front",
          "Enqueue adds to the front and dequeue removes from the middle",
          "Both happen at the back like a stack",
        ],
        answer: 0,
        explanation: "New arrivals join the back of the line while service happens at the front.",
        concept: "enqueue and dequeue ends",
      },
      {
        id: "queues-3",
        prompt: "Why is using a plain array's shift() (removing index 0 and shifting all items left) inefficient for a large queue?",
        options: [
          "Every dequeue shifts all remaining elements in O(n) time instead of O(1)",
          "It causes the queue to behave like a LIFO stack",
          "Arrays cannot store more than 10 elements",
          "shift() deletes the entire array",
        ],
        answer: 0,
        explanation: "Using front/rear pointers or a circular buffer avoids O(n) shifting on dequeue.",
        concept: "circular buffer efficiency",
      },
      {
        id: "queues-4",
        prompt: "Which graph traversal algorithm relies on a queue to explore nodes level by level?",
        options: [
          "Breadth-First Search (BFS)",
          "Depth-First Search (DFS)",
          "Binary Search",
          "Merge Sort",
        ],
        answer: 0,
        explanation: "BFS uses a FIFO queue so closer nodes (current level) are visited before deeper levels.",
        concept: "BFS queue application",
      },
      {
        id: "queues-5",
        prompt: "In a circular array queue of capacity N, how do you advance the rear index so it wraps around to 0 after reaching N - 1?",
        options: [
          "rear = (rear + 1) % N",
          "rear = rear - N",
          "rear = N / 2",
          "rear = rear * 2",
        ],
        answer: 0,
        explanation: "Modulo arithmetic wraps index N back to 0 cleanly in O(1) time.",
        concept: "circular wrap-around",
      },
    ],
    hi: [
      {
        id: "queues-1",
        prompt: "यदि खाली Queue में क्रमशः A, B और C को enqueue किया जाए, तो सबसे पहले dequeue होने पर कौन बाहर आएगा?",
        options: [
          "A, क्योंकि Queue में First-In, First-Out (FIFO) नियम चलता है",
          "C, क्योंकि वह सबसे अंत में जुड़ा था",
          "B, क्योंकि वह बीच में है",
          "तीनों एक साथ बाहर आएंगे",
        ],
        answer: 0,
        explanation: "FIFO नियम के अनुसार जो सबसे पहले कतार में आया (A), वही सबसे पहले बाहर निकलेगा।",
        concept: "FIFO ordering",
      },
      {
        id: "queues-2",
        prompt: "Queue में enqueue और dequeue किन सिरों पर होते हैं?",
        options: [
          "Enqueue पीछे (rear) से जोड़ता है और Dequeue आगे (front) से निकालता है",
          "दोनों काम केवल आगे (front) के सिरे पर होते हैं",
          "दोनों काम केवल पीछे (rear) के सिरे पर होते हैं",
          "Enqueue बीच में और Dequeue अंत में होता है",
        ],
        answer: 0,
        explanation: "जैसे टिकट लाइन में नए लोग पीछे जुड़ते हैं और आगे खड़े व्यक्ति को पहले सेवा मिलती है।",
        concept: "enqueue and dequeue ends",
      },
      {
        id: "queues-3",
        prompt: "बड़ी Queue के लिए साधारण Array से हर बार पहला तत्व हटाकर बाकी तत्वों को बाएँ खिसकाना (shift) धीमा क्यों होता है?",
        options: [
          "क्योंकि हर dequeue में सभी बचे हुए तत्वों को खिसकाने में O(n) समय लगता है",
          "इससे Queue उल्टी हो जाती है",
          "Array में संख्याएं स्टोर नहीं हो सकतीं",
          "इससे मेमोरी खत्म हो जाती है",
        ],
        answer: 0,
        explanation: "Front/Rear पॉइंटर्स या Circular Queue का उपयोग करने से dequeue O(1) में हो जाता है।",
        concept: "circular buffer efficiency",
      },
      {
        id: "queues-4",
        prompt: "कौन-सा एल्गोरिदम ग्राफ़ या ट्री को स्तर-दर-स्तर (level by level) खोजने के लिए Queue का उपयोग करता है?",
        options: [
          "Breadth-First Search (BFS)",
          "Depth-First Search (DFS)",
          "Binary Search",
          "Quick Sort",
        ],
        answer: 0,
        explanation: "BFS में Queue यह सुनिश्चित करती है कि वर्तमान स्तर के सभी नोड्स अगले स्तर से पहले देखे जाएं।",
        concept: "BFS queue application",
      },
      {
        id: "queues-5",
        prompt: "N क्षमता वाली Circular Queue में rear इंडेक्स को N - 1 के बाद वापस 0 पर घुमाने के लिए कौन-सा सूत्र उपयोग होता है?",
        options: [
          "rear = (rear + 1) % N",
          "rear = rear - N",
          "rear = N / 2",
          "rear = rear * 2",
        ],
        answer: 0,
        explanation: "Modulo (%) ऑपरेटर इंडेक्स को N पर पहुँचते ही वापस 0 पर ले आता है।",
        concept: "circular wrap-around",
      },
    ],
  },
  "binary-search": {
    en: [
      {
        id: "binary-search-1",
        prompt: "What mandatory precondition must hold before you can run Binary Search on an array?",
        options: [
          "The array must be sorted according to the search order",
          "The array length must be a power of 2",
          "All elements must be positive prime numbers",
          "The target value must be at index 0",
        ],
        answer: 0,
        explanation: "Disregarding half the array only works if the elements are ordered.",
        concept: "sorted precondition",
      },
      {
        id: "binary-search-2",
        prompt: "In Binary Search on an ascending sorted array, if arr[mid] is strictly less than the target value, how should the search range update?",
        options: [
          "Set low = mid + 1 to search the right half",
          "Set high = mid - 1 to search the left half",
          "Set low = 0 and high = mid",
          "Return mid immediately",
        ],
        answer: 0,
        explanation: "Since arr[mid] < target and the array is ascending, every index <= mid is also too small.",
        concept: "boundary update",
      },
      {
        id: "binary-search-3",
        prompt: "Why does Binary Search take O(log n) time in the worst case?",
        options: [
          "Each comparison cuts the remaining search interval in half",
          "It checks every second element in the array",
          "It sorts the array on every step",
          "It uses recursion without a base case",
        ],
        answer: 0,
        explanation: "Halving n repeatedly reaches size 1 in at most log2(n) + 1 steps.",
        concept: "logarithmic halving",
      },
      {
        id: "binary-search-4",
        prompt: "Why do many programmers write mid = low + Math.floor((high - low) / 2) instead of Math.floor((low + high) / 2)?",
        options: [
          "To prevent integer overflow when low + high exceeds the maximum safe integer limit",
          "Because subtraction is O(1) while addition is O(n)",
          "Because (low + high) / 2 gives a negative number",
          "To skip checking the middle element",
        ],
        answer: 0,
        explanation: "Adding two large indices can overflow fixed-width integers;high - low stays within bounds.",
        concept: "mid calculation",
      },
      {
        id: "binary-search-5",
        prompt: "At most how many comparisons does Binary Search need to check a sorted array of 1,024 elements?",
        options: ["11", "512", "1024", "100"],
        answer: 0,
        explanation: "Since 2^10 = 1024, halving takes at most 10 + 1 = 11 comparisons.",
        concept: "logarithmic halving",
      },
    ],
    hi: [
      {
        id: "binary-search-1",
        prompt: "किसी Array पर Binary Search लगाने से पहले कौन-सी शर्त अनिवार्य है?",
        options: [
          "Array के तत्व क्रमबद्ध (sorted) होने चाहिए",
          "Array की लंबाई सम संख्या (even) होनी चाहिए",
          "सभी संख्याएं धनात्मक होनी चाहिए",
          "खोजा जाने वाला तत्व हमेशा बीच में होना चाहिए",
        ],
        answer: 0,
        explanation: "डेटा sorted होने पर ही हम बीच के तत्व से तुलना करके आधा हिस्सा छोड़ सकते हैं।",
        concept: "sorted precondition",
      },
      {
        id: "binary-search-2",
        prompt: "बढ़ते क्रम (ascending) वाले Array में यदि arr[mid] लक्ष्य (target) से छोटा है, तो अगली खोज कहाँ होनी चाहिए?",
        options: [
          "दाएँ हिस्से में: low = mid + 1 करके",
          "बाएँ हिस्से में: high = mid - 1 करके",
          "शुरुआत में: low = 0 करके",
          "खोज तुरंत रोक देनी चाहिए",
        ],
        answer: 0,
        explanation: "चूँकि arr[mid] छोटा है और सूची बढ़ते क्रम में है, उत्तर mid के दाईं ओर ही हो सकता है।",
        concept: "boundary update",
      },
      {
        id: "binary-search-3",
        prompt: "Binary Search की worst-case time complexity O(log n) क्यों होती है?",
        options: [
          "क्योंकि हर कदम पर खोज का दायरा आधा हो जाता है",
          "क्योंकि यह हर दूसरे तत्व को जाँचता है",
          "क्योंकि यह पहले डेटा को सॉर्ट करता है",
          "क्योंकि यह केवल 2 तत्वों को देखता है",
        ],
        answer: 0,
        explanation: "n आकार के क्षेत्र को बार-बार आधा करने पर अधिकतम log₂(n) कदम लगते हैं।",
        concept: "logarithmic halving",
      },
      {
        id: "binary-search-4",
        prompt: "mid निकालने के लिए (low + high) / 2 के बजाय low + Math.floor((high - low) / 2) क्यों लिखा जाता है?",
        options: [
          "बड़े इंडेक्स जोड़ने पर होने वाले integer overflow से बचने के लिए",
          "क्योंकि घटाना जोड़ने से तेज़ होता है",
          "क्योंकि (low + high) गलत इंडेक्स देता है",
          "ताकि अंतिम तत्व छूट जाए",
        ],
        answer: 0,
        explanation: "बहुत बड़े arrays में low + high अधिकतम संख्या सीमा पार कर सकता है।",
        concept: "mid calculation",
      },
      {
        id: "binary-search-5",
        prompt: "1,024 तत्वों वाले sorted Array में किसी संख्या को खोजने के लिए Binary Search को अधिकतम कितनी तुलनाएं करनी पड़ेंगी?",
        options: ["11", "512", "1024", "100"],
        answer: 0,
        explanation: "2^10 = 1024 होता है, इसलिए अधिकतम 10 + 1 = 11 कदमों में परिणाम मिल जाता है।",
        concept: "logarithmic halving",
      },
    ],
  },
  recursion: {
    en: [
      {
        id: "recursion-1",
        prompt: "What happens if a recursive function is missing a reachable base case?",
        options: [
          "It calls itself endlessly until the call stack runs out of memory (Stack Overflow)",
          "It automatically returns 0 after 10 calls",
          "The compiler converts it into an empty array",
          "It runs in O(1) time",
        ],
        answer: 0,
        explanation: "Every recursive call allocates a stack frame; without a base case, memory is exhausted.",
        concept: "base case termination",
      },
      {
        id: "recursion-2",
        prompt: "Which data structure does the runtime environment use behind the scenes to track active recursive function calls?",
        options: [
          "The Call Stack (LIFO)",
          "A FIFO Queue",
          "A Hash Table",
          "A Binary Search Tree",
        ],
        answer: 0,
        explanation: "The most recently called function must finish and return first — a LIFO call stack.",
        concept: "call stack unwinding",
      },
      {
        id: "recursion-3",
        prompt: "In a recursive function factorial(n) = n * factorial(n - 1) with base case n <= 1 returning 1, why is passing n - 1 essential?",
        options: [
          "It shrinks the input each step so the calls progress strictly toward the base case",
          "It doubles the speed of multiplication",
          "It avoids using the call stack",
          "It sorts the numbers in descending order",
        ],
        answer: 0,
        explanation: "Each recursive step must reduce the problem toward the base case.",
        concept: "subproblem reduction",
      },
      {
        id: "recursion-4",
        prompt: "What is the space complexity of a simple recursive function that counts down from n to 0 one step at a time?",
        options: [
          "O(n), because n call frames exist on the call stack simultaneously at the deepest point",
          "O(1), because recursion uses no variables",
          "O(log n), because the stack compresses frames",
          "O(n²), because each call copies the entire program",
        ],
        answer: 0,
        explanation: "Depth n means n active stack frames before the base case starts unwinding.",
        concept: "recursive space complexity",
      },
      {
        id: "recursion-5",
        prompt: "In what order do recursive calls finish and return their results?",
        options: [
          "From the deepest base-case call back up to the original outer call",
          "From the first outer call down to the base case",
          "All calls return at the exact same instant",
          "In random order depending on CPU speed",
        ],
        answer: 0,
        explanation: "Inner calls must complete and return their value before waiting outer calls can finish.",
        concept: "call stack unwinding",
      },
    ],
    hi: [
      {
        id: "recursion-1",
        prompt: "यदि किसी recursive फ़ंक्शन में सही Base Case न हो, तो क्या होगा?",
        options: [
          "फ़ंक्शन खुद को अनंत बार कॉल करेगा जब तक Call Stack मेमोरी भर न जाए (Stack Overflow)",
          "फ़ंक्शन 5 बार चलकर अपने आप रुक जाएगा",
          "यह तुरंत 0 लौटा देगा",
          "यह O(1) समय में पूरा हो जाएगा",
        ],
        answer: 0,
        explanation: "बिना रुकने की शर्त (base case) के हर कॉल नया स्टैक फ्रेम जोड़ता जाता है।",
        concept: "base case termination",
      },
      {
        id: "recursion-2",
        prompt: "सक्रिय recursive फ़ंक्शन कॉल्स को ट्रैक करने के लिए सिस्टम अंदरूनी रूप से किस डेटा स्ट्रक्चर का उपयोग करता है?",
        options: [
          "Call Stack (LIFO)",
          "FIFO Queue",
          "Hash Table",
          "Linked List",
        ],
        answer: 0,
        explanation: "सबसे अंत में कॉल हुआ फ़ंक्शन सबसे पहले लौटता है, इसलिए Call Stack (LIFO) का उपयोग होता है।",
        concept: "call stack unwinding",
      },
      {
        id: "recursion-3",
        prompt: "factorial(n) = n * factorial(n - 1) में हर कदम पर n के बजाय n - 1 भेजना क्यों आवश्यक है?",
        options: [
          "ताकि हर कॉल समस्या को छोटा करे और अंततः Base Case (n <= 1) तक पहुँचे",
          "ताकि गुणा तेज़ हो सके",
          "ताकि मेमोरी बिल्कुल न लगे",
          "ताकि संख्याएं क्रम में रहें",
        ],
        answer: 0,
        explanation: "हर recursive कदम को Base Case की दिशा में बढ़ना चाहिए।",
        concept: "subproblem reduction",
      },
      {
        id: "recursion-4",
        prompt: "n से 0 तक एक-एक कदम घटने वाले साधारण recursive फ़ंक्शन की space complexity क्या होगी?",
        options: [
          "O(n), क्योंकि सबसे गहराई पर Call Stack में एक साथ n फ्रेम्स जमा होते हैं",
          "O(1), क्योंकि कोई नया array नहीं बना",
          "O(log n), क्योंकि स्टैक आधा हो जाता है",
          "O(n²), क्योंकि हर कॉल दोगुनी जगह लेता है",
        ],
        answer: 0,
        explanation: "Base case तक पहुँचने से पहले n कॉल्स स्टैक पर प्रतीक्षा करते हैं।",
        concept: "recursive space complexity",
      },
      {
        id: "recursion-5",
        prompt: "Recursion में फ़ंक्शन कॉल्स किस क्रम में अपना काम पूरा करके लौटते (unwind) हैं?",
        options: [
          "सबसे गहरे Base Case वाले कॉल से शुरू होकर वापस सबसे बाहरी कॉल की ओर",
          "सबसे बाहरी कॉल से शुरू होकर अंदर की ओर",
          "सभी कॉल्स एक ही समय पर एक साथ",
          "बिना किसी निश्चित क्रम के",
        ],
        answer: 0,
        explanation: "जब सबसे अंदरूनी कॉल उत्तर लौटाता है, तभी उससे पिछला कॉल अपनी गणना पूरी कर पाता है।",
        concept: "call stack unwinding",
      },
    ],
  },
};

export function getTopicQuestionPool(
  topic: string,
  language: LanguageCode = "en",
): QuizQuestion[] {
  const pool = TOPIC_QUIZ_POOLS[topic]?.[language];
  if (pool && pool.length >= 5) {
    return pool;
  }

  if (language === "hi") {
    return [
      {
        id: `${topic}-1`,
        prompt: `${topic} का मुख्य उद्देश्य क्या है?`,
        options: [
          "डेटा को व्यवस्थित तरीके से संग्रहीत और एक्सेस करना",
          "हर लाइन को बिना समझे याद करना",
          "उदाहरणों को छोड़ देना",
          "अभ्यास न करना",
        ],
        answer: 0,
        explanation: `${topic} का उद्देश्य डेटा को कुशलतापूर्वक संग्रहीत और एक्सेस करना है।`,
        concept: "core purpose",
      },
      {
        id: `${topic}-2`,
        prompt: "नई समस्या को समझने का पहला उपयोगी कदम क्या है?",
        options: [
          "एक छोटा उदाहरण बनाकर हाथ से ट्रेस करना",
          "सीधा सबसे कठिन कोड लिखना",
          "उत्तर देख लेना",
          "हर वेरिएबल का नाम बदलना",
        ],
        answer: 0,
        explanation: "छोटे उदाहरण से सोच साफ होती है।",
        concept: "problem decomposition",
      },
      {
        id: `${topic}-3`,
        prompt: "Time complexity क्यों महत्वपूर्ण है?",
        options: [
          "यह बताती है कि इनपुट बढ़ने पर एल्गोरिदम का समय कैसे बढ़ेगा",
          "यह कोड को छोटा बनाती है",
          "यह याददाश्त बढ़ाती है",
          "यह कोड चलाती है",
        ],
        answer: 0,
        explanation: "Time complexity से हम जानते हैं कि बड़े inputs पर कोड कितना तेज़ होगा।",
        concept: "time complexity",
      },
      {
        id: `${topic}-4`,
        prompt: "अच्छा अभ्यास किस पर ध्यान देता है?",
        options: [
          "अंतर्निहित पैटर्न और तर्क को समझने पर",
          "सिर्फ गति पर",
          "सिर्फ सिंटैक्स रटने पर",
          "अनुमान से चुनने पर",
        ],
        answer: 0,
        explanation: "पैटर्न समझने से आप नई समस्याओं पर भी वही विचार लगा सकते हैं।",
        concept: "pattern recognition",
      },
      {
        id: `${topic}-5`,
        prompt: "गलत उत्तर के बाद सबसे अच्छा कदम क्या है?",
        options: [
          "उस कदम की समीक्षा करना जहाँ तर्क बदला था",
          "अभ्यास बंद करना",
          "प्रश्न बदलना",
          "बिना सोचे दोबारा चुनना",
        ],
        answer: 0,
        explanation: "गलती की जगह ढूंढने से अगला सीखने का कदम साफ होता है।",
        concept: "error analysis",
      },
    ];
  }

  return [
    {
      id: `${topic}-1`,
      prompt: `What is the primary purpose of ${topic}?`,
      options: [
        "To store and access data efficiently for specific operations",
        "To memorize every line of code",
        "To avoid using examples",
        "To skip practice",
      ],
      answer: 0,
      explanation: `${topic} is designed for efficient data storage and retrieval.`,
      concept: "core purpose",
    },
    {
      id: `${topic}-2`,
      prompt: "What is a useful first step for a new problem?",
      options: [
        "Trace a tiny example by hand",
        "Write the hardest code first",
        "Look up the answer immediately",
        "Rename every variable",
      ],
      answer: 0,
      explanation: "A tiny example makes the problem concrete and traceable.",
      concept: "problem decomposition",
    },
    {
      id: `${topic}-3`,
      prompt: "Why does time complexity matter?",
      options: [
        "It shows how an algorithm scales as input size grows",
        "It makes code shorter",
        "It improves variable names",
        "It compiles the code",
      ],
      answer: 0,
      explanation: "Time complexity lets us predict performance on large inputs.",
      concept: "time complexity",
    },
    {
      id: `${topic}-4`,
      prompt: "What makes practice effective?",
      options: [
        "Understanding the underlying pattern and invariants",
        "Only chasing typing speed",
        "Only memorising syntax",
        "Only guessing",
      ],
      answer: 0,
      explanation: "Patterns transfer to new problems and inputs.",
      concept: "pattern recognition",
    },
    {
      id: `${topic}-5`,
      prompt: "What should you do after a wrong answer?",
      options: [
        "Review the exact step where your reasoning diverged",
        "Stop practising",
        "Ignore the explanation",
        "Guess again randomly",
      ],
      answer: 0,
      explanation: "Finding the turning point gives you a clear next step.",
      concept: "error analysis",
    },
  ];
}

function validateQuizQuestionArray(parsed: unknown): QuizQuestion[] | null {
  if (!Array.isArray(parsed) || parsed.length < 3) return null;
  const valid: QuizQuestion[] = [];
  for (let i = 0; i < parsed.length && valid.length < 5; i++) {
    const item = parsed[i] as Partial<QuizQuestion>;
    if (
      item &&
      typeof item.prompt === "string" &&
      item.prompt.trim().length > 5 &&
      Array.isArray(item.options) &&
      item.options.length === 4 &&
      item.options.every((o) => typeof o === "string" && o.trim().length > 0) &&
      typeof item.answer === "number" &&
      Number.isInteger(item.answer) &&
      item.answer >= 0 &&
      item.answer < 4
    ) {
      valid.push({
        id: typeof item.id === "string" && item.id ? item.id : `q-${i + 1}`,
        prompt: item.prompt.trim(),
        options: item.options.map((o) => o.trim()),
        answer: item.answer,
        explanation:
          typeof item.explanation === "string" && item.explanation.trim()
            ? item.explanation.trim()
            : "Review how this operation behaves on a small example.",
        concept:
          typeof item.concept === "string" && item.concept.trim()
            ? item.concept.trim()
            : "core concept",
      });
    }
  }
  return valid.length >= 3 ? valid : null;
}

// ── Agent 1: Quiz & Testing Generator ────────────────────────────────────────

export async function generateQuiz(
  topic: string,
  language: LanguageCode = "en",
  options?: {
    weakConcepts?: string[];
    forceFreshAI?: boolean;
  },
): Promise<QuizQuestion[]> {
  const pool = getTopicQuestionPool(topic, language);

  // Use the verified topic-specific pool by default unless AI generation is explicitly requested or pool is generic
  const hasDedicatedPool = Boolean(TOPIC_QUIZ_POOLS[topic]?.[language]);
  if (hasDedicatedPool && !options?.forceFreshAI) {
    return pool.slice(0, 5);
  }

  try {
    const article = await getLessonContent(topic, language);
    const objectives = getTopicLearningObjectives(topic, language);
    const articleSummary = `${article.title}: ${article.lead}`;

    const aiQuestions = await invokeBedrockJSON<QuizQuestion[]>(
      PROMPTS.quizSystem(language),
      PROMPTS.quizUser(topic, language, {
        articleSummary,
        objectives,
        weakConcepts: options?.weakConcepts,
      }),
      validateQuizQuestionArray,
      { task: "quiz", maxTokens: 1200, temperature: 0.5 },
    );

    if (aiQuestions && aiQuestions.length >= 3) {
      return aiQuestions;
    }
  } catch (error) {
    console.warn("[quiz] AI quiz generation fallback to verified pool:", error);
  }

  return pool.slice(0, 5);
}

/**
 * Generates or selects a single targeted follow-up question to re-test a weak concept
 * after Agent 3 (Explain Differently) teaches the concept.
 */
export async function generateTargetedRetestQuestion(
  topicSlug: string,
  weakConcept: string,
  language: LanguageCode = "en",
  explanationGiven?: string,
  excludeQuestionIds: string[] = [],
): Promise<QuizQuestion> {
  const normalizedConcept = weakConcept.toLowerCase().trim();
  const pool = getTopicQuestionPool(topicSlug, language);

  // 1. Try to find an unused question in the verified pool matching the weak concept
  const poolMatch = pool.find(
    (q) =>
      !excludeQuestionIds.includes(q.id) &&
      (q.concept.toLowerCase().includes(normalizedConcept) ||
        normalizedConcept.includes(q.concept.toLowerCase())),
  );
  if (poolMatch) {
    return poolMatch;
  }

  // 2. Try Bedrock generation for a fresh targeted question
  const aiQuestion = await invokeBedrockJSON<QuizQuestion>(
    PROMPTS.retestQuestionSystem(language),
    PROMPTS.retestQuestionUser(topicSlug, weakConcept, language, explanationGiven),
    (parsed) => {
      if (!parsed || typeof parsed !== "object") return null;
      const item = parsed as Partial<QuizQuestion>;
      if (
        typeof item.prompt === "string" &&
        Array.isArray(item.options) &&
        item.options.length === 4 &&
        typeof item.answer === "number" &&
        item.answer >= 0 &&
        item.answer < 4
      ) {
        return {
          id: `retest-${topicSlug}-${Date.now()}`,
          prompt: item.prompt.trim(),
          options: item.options.map(String),
          answer: item.answer,
          explanation:
            typeof item.explanation === "string"
              ? item.explanation
              : "Trace the concept step by step.",
          concept: weakConcept || "core concept",
        };
      }
      return null;
    },
    { task: "quiz", maxTokens: 450, temperature: 0.4 },
  );

  if (aiQuestion) return aiQuestion;

  // 3. Deterministic concept-specific re-test fallback (never reveals the answer in the prompt)
  const unused = pool.find((q) => !excludeQuestionIds.includes(q.id));
  if (unused) {
    return {
      ...unused,
      id: `retest-${unused.id}`,
      concept: weakConcept || unused.concept,
    };
  }

  return {
    ...pool[0],
    id: `retest-${topicSlug}-fallback`,
    concept: weakConcept || pool[0].concept,
  };
}
