"use client";

import {
  SiFacebook,
  SiInstagram,
  SiSnapchat,
  SiTiktok,
} from "react-icons/si";
import type { IconType } from "react-icons";
import type { PublicSocialUrls } from "@/lib/config/site";

type SocialMod = "facebook" | "instagram" | "tiktok" | "snapchat";

type SocialTemplateRow = {
  id: keyof PublicSocialUrls;
  label: string;
  mod: SocialMod;
  Icon: IconType;
};

const socialTemplate: SocialTemplateRow[] = [
  {
    id: "facebook",
    label: "فيسبوك",
    Icon: SiFacebook,
    mod: "facebook",
  },
  {
    id: "instagram",
    label: "إنستغرام",
    Icon: SiInstagram,
    mod: "instagram",
  },
  {
    id: "tiktok",
    label: "تيك توك",
    Icon: SiTiktok,
    mod: "tiktok",
  },
  {
    id: "snapchat",
    label: "سناب شات",
    Icon: SiSnapchat,
    mod: "snapchat",
  },
];

export type SocialLinksProps = {
  className?: string;
  /** يُقرأ من الخادم (مثلاً `readPublicSocialUrls()`) ثم يُمرَّر هنا لضمان تطابق SSR والعميل */
  urls: PublicSocialUrls;
};

export function SocialLinks({ className, urls }: SocialLinksProps) {
  return (
    <div
      className={`social-links${className ? ` ${className}` : ""}`}
      role="list"
    >
      {socialTemplate.map(({ id, label, Icon, mod }) => {
        const href = (urls[id] ?? "").trim();
        const isEnabled = Boolean(href);
        return isEnabled ? (
          <a
            key={id}
            className={`social-link social-link--${mod}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            role="listitem"
          >
            <Icon aria-hidden className="social-link__icon" />
          </a>
        ) : (
          <span
            key={id}
            className={`social-link social-link--disabled social-link--${mod}`}
            role="listitem"
            title="لم يُضبط الرابط بعد — أضيفي NEXT_PUBLIC_SOCIAL_* في .env.local أو عبّئي socialFallback في site.ts"
            aria-label={`${label} — الرابط غير مضبوط`}
          >
            <Icon aria-hidden className="social-link__icon" />
          </span>
        );
      })}
    </div>
  );
}
