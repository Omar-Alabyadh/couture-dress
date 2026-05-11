import nextVitals from "eslint-config-next/core-web-vitals";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  { ignores: ["src/generated/prisma/**"] },
  ...nextVitals,
];

export default config;
