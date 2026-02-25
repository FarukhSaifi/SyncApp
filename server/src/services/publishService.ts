import axios from 'axios';
import { decrypt } from '../utils/encryption';
import { ERROR_MESSAGES, API_URLS, FIELDS, HTTP, PLATFORMS } from '../constants';
import type { IPostDocument } from '../models/Post';
import type { ICredentialDocument } from '../models/Credential';

export async function publishToMedium(post: IPostDocument, credential: ICredentialDocument) {
  const apiKey = decrypt(credential.api_key);
  if (!apiKey) throw new Error(ERROR_MESSAGES.INVALID_MEDIUM_API_KEY);

  const userResponse = await axios.get(API_URLS.MEDIUM.ME_ENDPOINT, {
    headers: {
      [HTTP.HEADERS.AUTHORIZATION]: `${HTTP.AUTH_SCHEMES.BEARER} ${apiKey}`,
      [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
    },
  });

  const userId = userResponse.data.data.id;
  const publishResponse = await axios.post(
    API_URLS.MEDIUM.POSTS_ENDPOINT(userId),
    {
      title: post.title,
      contentFormat: 'markdown',
      content: post.content_markdown,
      publishStatus: 'public',
    },
    {
      headers: {
        [HTTP.HEADERS.AUTHORIZATION]: `${HTTP.AUTH_SCHEMES.BEARER} ${apiKey}`,
        [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
      },
    },
  );

  return {
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.MEDIUM)]: true,
    [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.MEDIUM)]: publishResponse.data.data.id,
    [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.MEDIUM)]: publishResponse.data.data.url,
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.MEDIUM)]: new Date(),
  };
}

export async function publishToDevto(post: IPostDocument, credential: ICredentialDocument) {
  const apiKey = decrypt(credential.api_key);
  if (!apiKey) throw new Error(ERROR_MESSAGES.INVALID_DEVTO_API_KEY);

  const publishResponse = await axios.post(
    API_URLS.DEVTO.ARTICLES_ENDPOINT,
    {
      article: {
        title: post.title,
        body_markdown: post.content_markdown,
        published: true,
        tags: post.tags || [],
        main_image: post.cover_image || '',
        canonical_url: post.canonical_url || '',
      },
    },
    {
      headers: {
        [HTTP.HEADERS.API_KEY]: apiKey,
        [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
      },
    },
  );

  return {
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.DEVTO)]: true,
    [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.DEVTO)]: publishResponse.data.id.toString(),
    [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.DEVTO)]: publishResponse.data.url,
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.DEVTO)]: new Date(),
  };
}

export async function publishToWordpress(post: IPostDocument, credential: ICredentialDocument) {
  const apiKey = decrypt(credential.api_key);
  if (!apiKey) throw new Error(ERROR_MESSAGES.INVALID_WORDPRESS_API_KEY);

  const siteUrl = credential.site_url || (credential.platform_config as { wordpress_url?: string } | undefined)?.wordpress_url;
  if (!siteUrl) throw new Error(ERROR_MESSAGES.WORDPRESS_SITE_URL_NOT_CONFIGURED);

  const publishResponse = await axios.post(
    API_URLS.WORDPRESS.POSTS_ENDPOINT(siteUrl),
    {
      title: post.title,
      content: post.content_markdown,
      status: 'publish',
      tags: post.tags || [],
    },
    {
      headers: {
        [HTTP.HEADERS.AUTHORIZATION]: `${HTTP.AUTH_SCHEMES.BEARER} ${apiKey}`,
        [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
      },
    },
  );

  return {
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.WORDPRESS)]: true,
    [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.WORDPRESS)]: publishResponse.data.id.toString(),
    [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.WORDPRESS)]: publishResponse.data.link,
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.WORDPRESS)]: new Date(),
  };
}
