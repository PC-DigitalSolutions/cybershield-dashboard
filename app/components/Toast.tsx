"use client";
import { useEffect } from "react";
export default function Toast({ message, onClose }: { message: string; onClose: () => void; }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-[#071018] border border-emerald-400/30 text-emerald-200 px-4 py-3 rounded-lg shadow-lg animate-fade-in">
        <div className="font-medium">{message}</div>
      </div>
    </div>
  );
}
