const axios = require("axios");
const { decrypt } = require("../utils/encryption");

async function publishToMedium(post, credential) {
  const apiKey = decrypt(credential.api_key);
  if (!apiKey) throw new Error("Invalid Medium API key");
  const userResponse = await axios.get("https://api.medium.com/v1/me", {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  });
  const authorId = userResponse.data.data.id;
  const publishResponse = await axios.post(
    `https://api.medium.com/v1/users/${authorId}/posts`,
    { title: post.title, contentFormat: "markdown", content: post.content_markdown, publishStatus: "public" },
    { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
  );
  return {
    "platform_status.medium.published": true,
    "platform_status.medium.post_id": publishResponse.data.data.id,
    "platform_status.medium.url": publishResponse.data.data.url,
    "platform_status.medium.published_at": new Date(),
  };
}

async function publishToDevto(post, credential) {
  const apiKey = decrypt(credential.api_key);
  if (!apiKey) throw new Error("Invalid DEV.to API key");
  const publishResponse = await axios.post(
    "https://dev.to/api/articles",
    {
      article: {
        title: post.title,
        body_markdown: post.content_markdown,
        published: true,
        tags: post.tags || ["general"],
        cover_image: post.cover_image || null,
        canonical_url: post.canonical_url || null,
      },
    },
    { headers: { "api-key": apiKey, "Content-Type": "application/json" } }
  );
  return {
    "platform_status.devto.published": true,
    "platform_status.devto.post_id": publishResponse.data.id.toString(),
    "platform_status.devto.url": publishResponse.data.url,
    "platform_status.devto.published_at": new Date(),
  };
}

async function publishToWordpress(post, credential) {
  const apiKey = decrypt(credential.api_key);
  if (!apiKey) throw new Error("Invalid WordPress API key");
  const siteUrl = credential.site_url || credential.additional_data?.site_url;
  if (!siteUrl) throw new Error("WordPress site URL not configured");
  const publishResponse = await axios.post(
    `${siteUrl}/wp-json/wp/v2/posts`,
    {
      title: post.title,
      content: post.content_markdown,
      status: "publish",
      categories: post.tags && post.tags.length > 0 ? post.tags : [],
      featured_media: post.cover_image || null,
      meta: { canonical_url: post.canonical_url || null },
    },
    { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
  );
  return {
    "platform_status.wordpress.published": true,
    "platform_status.wordpress.post_id": publishResponse.data.id.toString(),
    "platform_status.wordpress.url": publishResponse.data.link,
    "platform_status.wordpress.published_at": new Date(),
  };
}

module.exports = { publishToMedium, publishToDevto, publishToWordpress };
