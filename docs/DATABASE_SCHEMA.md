# SyncApp Database Schema

MongoDB Atlas stores three primary collections: **users**, **posts**, and **credentials**. All are defined as Mongoose models under [`server/src/models/`](../server/src/models/).

## Entity Relationship

```mermaid
erDiagram
    USER ||--o{ POST : author
    USER ||--o{ CREDENTIAL : author
    USER {
        ObjectId _id PK
        string username UK
        string email UK
        string password
        string role
        boolean isVerified
    }
    POST {
        ObjectId _id PK
        ObjectId author FK
        string slug UK
        string title
        string status
        object platform_status
        date scheduled_for
    }
    CREDENTIAL {
        ObjectId _id PK
        ObjectId author FK
        string platform_name
        string api_key
        boolean is_active
    }
```

## User

| Field                   | Type              | Notes             |
| ----------------------- | ----------------- | ----------------- |
| `username`              | String            | Unique, required  |
| `email`                 | String            | Unique, lowercase |
| `password`              | String            | Bcrypt-hashed     |
| `firstName`, `lastName` | String            | Profile           |
| `role`                  | `user` \| `admin` | RBAC              |
| `isVerified`            | Boolean           | Admin-managed     |
| `lastLogin`             | Date              | Optional          |

**Indexes:** `{ role: 1, createdAt: -1 }`

## Post

| Field                    | Type                                 | Notes                            |
| ------------------------ | ------------------------------------ | -------------------------------- |
| `author`                 | ObjectId                             | Ref `User`                       |
| `slug`                   | String                               | Unique, auto from title          |
| `title`                  | String                               | Required                         |
| `content_markdown`       | String                               | Required                         |
| `status`                 | `draft` \| `published` \| `archived` | Default `draft`                  |
| `platform_status`        | Object                               | Per-platform publish state       |
| `tags`                   | String[]                             |                                  |
| `meta_description`       | String                               | Max 160 chars                    |
| `cover_image`            | String                               | GCS public URL                   |
| `canonical_url`          | String                               | SEO                              |
| `linkedin_post`          | String                               | Short LinkedIn teaser text       |
| `linkedin_read_more_url` | String                               | Public article URL for Read more |
| `scheduled_for`          | Date                                 | Cron trigger when due            |

**Indexes:** `{ author, createdAt }`, `{ status, scheduled_for }`

**`platform_status` keys:** `medium`, `devto`, `wordpress`, `linkedin` — each `{ published, post_id, url, published_at }`.

## Credential

| Field              | Type     | Notes                                                  |
| ------------------ | -------- | ------------------------------------------------------ |
| `author`           | ObjectId | Ref `User`                                             |
| `platform_name`    | Enum     | `medium`, `devto`, `wordpress`, `linkedin`, `hashnode` |
| `api_key`          | String   | Encrypted at rest (access token for LinkedIn)          |
| `refresh_token`    | String   | Encrypted; LinkedIn OAuth refresh token                |
| `token_expires_at` | Date     | LinkedIn access token expiry                           |
| `site_url`         | String   | Required for WordPress                                 |
| `is_active`        | Boolean  | Only active creds used for publish/cron                |
| `platform_config`  | Object   | e.g. `devto_username`, `linkedin_person_urn`           |

**Indexes:** Unique `{ author, platform_name }`, `{ author, is_active }`

## Security

- API keys encrypted with AES-256-CBC before persistence ([`server/src/utils/encryption.ts`](../server/src/utils/encryption.ts)).
- Decryption occurs only in memory during publish operations.

See also [SYSTEM_FLOWS.md](./SYSTEM_FLOWS.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).
