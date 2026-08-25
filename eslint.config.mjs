import nextPluginConfig from "eslint-config-next";

/**
 * Next 16 removed `next lint`. Use eslint-config-next's flat config directly.
 * Ignores build output and dependencies.
 */
const eslintConfig = [
  ...nextPluginConfig,
  {
    ignores: [".next/**", "node_modules/**", "out/**"],
  },
];

export default eslintConfig;
