import type { SizeOptionType } from "@/generated/prisma/client";

export type DefaultSizeOptionSeed = {
  label: string;
  type: SizeOptionType;
  sortOrder: number;
};

const LETTER_SIZES = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "4XL",
  "5XL",
] as const;

function numberSizes(): DefaultSizeOptionSeed[] {
  const rows: DefaultSizeOptionSeed[] = [];
  for (let n = 0; n <= 62; n++) {
    rows.push({
      label: String(n),
      type: "NUMBER",
      sortOrder: n,
    });
  }
  return rows;
}

/** Default catalog sizes — idempotent by (type, label). */
export const DEFAULT_SIZE_OPTIONS: readonly DefaultSizeOptionSeed[] = [
  { label: "Standard", type: "STANDARD", sortOrder: 0 },
  ...LETTER_SIZES.map((label, i) => ({
    label,
    type: "LETTER" as const,
    sortOrder: i,
  })),
  ...numberSizes(),
];

export const SIZE_TYPE_LABELS: Record<SizeOptionType, string> = {
  STANDARD: "مقاس واحد",
  LETTER: "حرفي",
  NUMBER: "رقمي",
};
