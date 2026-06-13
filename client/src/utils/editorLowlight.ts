/**
 * TipTap code-block syntax highlighting — registers only common dev-blog languages
 * instead of lowlight's full `common` bundle (~40+ grammars).
 */
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import go from "highlight.js/lib/languages/go";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import { createLowlight } from "lowlight";

const lowlight = createLowlight();

lowlight.register({
  bash,
  css,
  dockerfile,
  go,
  html: xml,
  javascript,
  json,
  markdown,
  python,
  rust,
  shell: bash,
  sql,
  typescript,
  xml,
  yaml,
});

lowlight.registerAlias({
  js: ["javascript"],
  ts: ["typescript"],
  md: ["markdown"],
  sh: ["bash", "shell"],
  yml: ["yaml"],
});

export default lowlight;
