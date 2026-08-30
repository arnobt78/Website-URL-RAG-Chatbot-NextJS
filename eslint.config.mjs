import nextPluginConfig from "eslint-config-next";

/**
 * Next 16 removed `next lint`. Use eslint-config-next's flat config directly.
 * Global ignores must be a lone `ignores` object (flat-config rule).
 */
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "coverage/**",
      "**/.venv/**",
      "**/site-packages/**",
      "services/agentic-pipeline/**",
    ],
  },
  ...nextPluginConfig,
];

export default eslintConfig;
