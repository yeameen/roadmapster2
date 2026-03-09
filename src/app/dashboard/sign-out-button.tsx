"use client";

import { signOut } from "@/app/login/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
      >
        Sign out
      </button>
    </form>
  );
}
