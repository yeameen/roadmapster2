"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";

type Props = {
  workspaces: { id: string; name: string }[];
  activeWorkspaceId: string;
};

export function WorkspaceSwitcher({ workspaces, activeWorkspaceId }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const active = workspaces.find((w) => w.id === activeWorkspaceId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchWorkspace(id: string) {
    setOpen(false);
    if (id !== activeWorkspaceId) {
      router.push(`/dashboard?workspace=${id}`);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-300"
      >
        {active?.name ?? "Workspace"}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-48 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 py-1 shadow-warm-md">
          {workspaces.map((w) => (
            <button
              key={w.id}
              onClick={() => switchWorkspace(w.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              <span className="w-4 shrink-0">
                {w.id === activeWorkspaceId && (
                  <Check className="h-4 w-4 text-amber-500" />
                )}
              </span>
              <span className="truncate">{w.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
