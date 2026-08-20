import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-8 px-6 text-slate-600 dark:text-zinc-400 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <div className="p-1 bg-indigo-600 rounded">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span>LearnSpaceAI</span>
        </div>

        <p className="text-xs text-slate-500 dark:text-zinc-500">
          © {new Date().getFullYear()} All rights reserved.
        </p>

        <div className="flex gap-4 text-xs font-medium">
          <Link
            className="hover:text-indigo-600 dark:hover:text-indigo-400"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="hover:text-indigo-600 dark:hover:text-indigo-400"
            href="/learning-path"
          >
            Learning Paths
          </Link>
          <Link
            className="hover:text-indigo-600 dark:hover:text-indigo-400"
            href="/todos"
          >
            Workspace
          </Link>
        </div>
      </div>
    </footer>
  );
}
