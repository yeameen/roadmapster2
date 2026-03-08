"use client";

import { signOut } from "@/app/login/actions";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      Sign out
    </button>
  );
}
