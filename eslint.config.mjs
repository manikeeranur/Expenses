import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      // This app looks up icon components from a fixed name -> component
      // map (see lib/icons.js) to render category/notification icons that
      // are only known at render time. The map only ever returns a stable
      // reference to one of a fixed set of imported components, so this
      // isn't the dynamic-component-creation pattern the rule targets.
      "react-hooks/static-components": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
