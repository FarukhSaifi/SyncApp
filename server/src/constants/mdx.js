/**
 * MDX Export Configuration
 */

module.exports = Object.freeze({
  // Frontmatter field names
  FRONTMATTER_FIELDS: {
    TITLE: "title",
    DATE: "date",
    TAGS: "tags",
    COVER_IMAGE: "cover_image",
    CANONICAL_URL: "canonical_url",
  },

  // Frontmatter delimiters
  DELIMITER: "---",

  // Filename patterns
  FILENAME: {
    EXTENSION: ".mdx",
    DEFAULT_TITLE: "untitled-post",
    DATE_FORMAT_LENGTH: 10, // YYYY-MM-DD
  },
});
