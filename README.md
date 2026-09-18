# bodh.

**A calmer way to learn computer science.**

bodh. is a personalized learning experience for making difficult computer
science ideas feel graspable. Learners aged 15-20 can study DSA in English or
Hindi through short lessons, practice quizzes, agent feedback, and a roadmap
that adjusts after each assessment.

## What is in the app

...

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm

### Install and run

From the `my-app` directory:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The main product flows are available at:

| Route                    | Purpose                             |
| ------------------------ | ----------------------------------- |
| `/`                      | Product home page                   |
| `/about`                 | About bodh.                         |
| `/onboarding`            | Choose a learning starting point    |
| `/onboarding/language`   | Choose a preferred language         |
| `/learn`                 | Browse the learning library         |
| `/learn/[topic]`         | View a topic path and lessons       |
| `/learn/[topic]/article` | Read a lesson with its mind map     |
| `/learn/[topic]/mindmap` | Explore the topic visually          |
| `/learn/[topic]/quiz`    | Practice with a topic quiz          |
| `/dashboard`             | Review progress and recommendations |
| `/auth`                  | Request and verify an email code    |

The learning flow is: sign in, choose a language, choose a topic, read the
localized lesson, complete five questions, review the score and learning-team
feedback, choose a teaching style, and continue to the next topic.

## Configuration

Copy the example environment file when working with AWS-backed features:

```bash
Copy-Item .env.example .env.local
```

The variables are:

| Variable                | Used for                            |
| ----------------------- | ----------------------------------- |
| `AWS_REGION`            | AWS service region                  |
| `AWS_ACCESS_KEY_ID`     | Local AWS credentials, when needed  |
| `AWS_SECRET_ACCESS_KEY` | Local AWS credentials, when needed  |
| `AWS_S3_BUCKET`         | Lesson/content storage              |
| `AWS_DYNAMODB_TABLE`    | Student and progress persistence    |
| `BEDROCK_MODEL_ID`      | Bedrock model selection             |
| `AWS_AUTH_TABLE`        | Verification-code persistence       |
| `AUTH_SECRET`           | Session signing secret              |
| `RESEND_API_KEY`        | Resend email delivery               |
| `RESEND_FROM_EMAIL`     | Verified Resend sender address      |
| `AGENTCORE_RUNTIME_URL` | Optional AgentCore runtime endpoint |

The UI and local learning data can run without these values. Configure AWS
credentials through your normal local AWS credential provider where possible;
do not commit secrets to `.env.local` or source control.

Without `RESEND_API_KEY`, development prints verification codes to the server
console. Without AWS or an AgentCore runtime, the teaching team uses a local
adapter so the UI remains usable. In production, set `AUTH_SECRET`, Resend
credentials, `AWS_REGION`, `AWS_AUTH_TABLE`, and either
`AGENTCORE_RUNTIME_URL` or `BEDROCK_MODEL_ID`.

## Content and project structure

```text
content/seed/       Seed lesson material grouped by topic
public/             Static icons and images
scripts/            Content and storage utilities
src/app/            App Router pages and API routes
src/components/     Dashboard, learning, quiz, and shared UI components
src/config/         Supported languages and learning topics
src/lib/            AI, AWS, learning, and personalization logic
src/types/          Shared TypeScript domain types
```

Topic metadata lives in `src/config/topics.ts`. Seed content is organized in
`content/seed/` using the topic slugs `arrays`, `binary-search`, `linked-list`,
`queues`, `recursion`, and `stacks`.

## API routes

The App Router includes server endpoints for the learning experience:

- `/api/learn`
- `/api/progress`
- `/api/quiz/generate`
- `/api/quiz/submit`
- `/api/recommendation`
- `/api/student`
- `/api/topics`
- `/api/auth/request-code`
- `/api/auth/verify`
- `/api/auth/me`
- `/api/teach` (teacher, evaluator, and assessor collaboration)

## Available scripts

```bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm run start     # Serve the production build
npm run lint      # Run ESLint
```

There is currently no automated test script in `package.json`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
