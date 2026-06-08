"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActiveSurveyOption {
  id: string;
  title: string;
}

interface FillSurveyButtonProps {
  surveys: ActiveSurveyOption[];
}

export function FillSurveyButton({ surveys }: FillSurveyButtonProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (surveys.length === 0) return null;

  if (surveys.length === 1) {
    return (
      <Link href={`/survey/${surveys[0].id}`}>
        <Button>Isi Survey Aktif ⭐</Button>
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button onClick={() => setOpen((v) => !v)} className="gap-2">
        Isi Survey Aktif ⭐
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 min-w-[16rem] overflow-hidden rounded-xl border bg-white shadow-lg">
          <p className="border-b px-4 py-2 text-xs font-semibold text-muted-foreground">
            Pilih survey yang ingin diisi
          </p>
          {surveys.map((survey) => (
            <Link
              key={survey.id}
              href={`/survey/${survey.id}`}
              className="block px-4 py-3 text-sm font-medium transition hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              {survey.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
