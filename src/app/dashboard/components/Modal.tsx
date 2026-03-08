"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

type Props = {
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
};

export function Modal({ onClose, children, maxWidth = "max-w-md" }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    // Trap focus: mark everything outside the modal as inert
    const mainContent = document.querySelector("main");
    const header = document.querySelector("header");
    if (mainContent) mainContent.setAttribute("inert", "");
    if (header) header.setAttribute("inert", "");

    // Focus the panel
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (mainContent) mainContent.removeAttribute("inert");
      if (header) header.removeAttribute("inert");
    };
  }, [handleKeyDown]);

  return createPortal(
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`modal-panel mx-4 w-full ${maxWidth} rounded-lg bg-white dark:bg-gray-900 shadow-xl dark:shadow-black/40 outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
