"use client";

import { signOut } from "@/app/login/actions";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      Sign out
    </button>
  );
}
