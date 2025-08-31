"use client";

import React from "react";

type LoadingOverlayProps = {
  open: boolean;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export default function LoadingOverlay({ open, title = "Loading", description, children }: LoadingOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
      <div className="bg-white/95 dark:bg-black/90 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl w-full max-w-lg mx-4 pointer-events-auto">
        {children ?? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-black border-gray-200" />
            <h3 className="text-xl font-bold">{title}</h3>
            {description && <p className="text-sm text-gray-700 text-center">{description}</p>}
          </>
        )}
      </div>
    </div>
  );
}
