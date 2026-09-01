import { noAmbiguousFilterBoolean } from "./rules/no-ambiguous-filter-boolean.js";

const plugin = {
  meta: {
    name: "eslint-plugin-is-kit",
    version: "0.1.0",
  },
  rules: {
    "no-ambiguous-filter-boolean": noAmbiguousFilterBoolean,
  },
};

export default plugin;
export { noAmbiguousFilterBoolean };
