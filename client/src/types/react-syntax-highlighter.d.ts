// Type declarations for react-syntax-highlighter deep imports
// These avoid the barrel export which tries to load lowlight v2

declare module "react-syntax-highlighter/dist/esm/prism-async-light" {
  import { ComponentType } from "react";
  const SyntaxHighlighter: ComponentType<any>;
  export default SyntaxHighlighter;
}

declare module "react-syntax-highlighter/dist/esm/styles/prism/one-dark" {
  const style: Record<string, React.CSSProperties>;
  export default style;
}
