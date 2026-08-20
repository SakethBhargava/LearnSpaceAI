# LearnSpaceAI 🚀

An end-to-end, full-stack AI-powered Learning Management Platform built with Next.js 14, TypeScript, Supabase, and Google Gemini API. **LearnSpaceAI** automatically generates structured learning path roadmaps, interactive practice quizzes, and offers real-time AI study assistance tailored to any subject.

---

## ✨ Key Features

- 🧠 **AI Learning Paths:** Generate high-yield, structured module roadmaps for complex technical topics in seconds using Google Gemini.
- ⚡ **Dynamic Practice Quizzes:** Automatically produce multiple-choice assessments mapped to your active study topics.
- 🔥 **Streak & Calendar Tracking:** Track real-time study habits with automated streak management and calendar logs.
- 🔒 **Multi-Tenant Security:** Full data isolation enforced via **PostgreSQL Row Level Security (RLS)** in Supabase (`auth.uid() = user_id`).
- 🎨 **Modern Design System:** Built with Tailwind CSS and Shadcn UI, featuring responsive layouts, custom glassmorphic cards, glowing accents, and dark mode support.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router & React Server Components)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL with RLS)
- **AI Engine:** [Google Gemini API](https://ai.google.dev/)
- **Styling & UI:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Deployment:** [Netlify](https://www.netlify.com/)

---

## 🚀 Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm, yarn, or pnpm
- A Supabase project account
- A Google Gemini API Key

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/learnspace-ai.git
cd learnspace-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory and add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
