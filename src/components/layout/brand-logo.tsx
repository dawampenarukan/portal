import Image from "next/image";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";

type BrandLogoSize = "sm" | "md" | "lg";
type BrandLogoTone = "light" | "dark";

interface BrandLogoProps {
  size?: BrandLogoSize;
  tone?: BrandLogoTone;
  className?: string;
  priority?: boolean;
}

const sizeMap: Record<
  BrandLogoSize,
  { height: number; width: number; className: string }
> = {
  sm: { height: 52, width: 110, className: "h-[52px] w-auto" },
  md: { height: 60, width: 128, className: "h-[60px] w-auto" },
  lg: { height: 88, width: 180, className: "h-[88px] w-auto" },
};

export function BrandLogo({
  size = "md",
  tone = "dark",
  className,
  priority = false,
}: BrandLogoProps) {
  const { height, width, className: sizeClass } = sizeMap[size];

  return (
    <Image
      src="/images/logo.png?v=3"
      alt={`Logo ${SITE_NAME}`}
      width={width}
      height={height}
      unoptimized
      style={{ width: "auto" }}
      className={cn(
        "shrink-0 object-contain",
        sizeClass,
        tone === "light" && "rounded-xl bg-white/95 p-1",
        className
      )}
      priority={priority}
    />
  );
}
