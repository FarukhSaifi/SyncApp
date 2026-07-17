import dayjs from "dayjs";
import { POST_STATUS } from "../constants";
import Post from "../models/Post";
import { toObjectId } from "../utils/objectId";

function authorMatchStage(userId: string) {
  return { $match: { author: toObjectId(userId) } };
}

/**
 * Get distribution of posts by status for a user
 */
export async function getStatusDistribution(userId: string) {
  const distribution = await Post.aggregate([
    authorMatchStage(userId),
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  return distribution.reduce((acc: Record<string, number>, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});
}

/**
 * Get distribution of published posts across platforms for a user
 */
export async function getPlatformDistribution(userId: string) {
  const results = await Post.aggregate([
    authorMatchStage(userId),
    {
      $facet: {
        medium: [{ $match: { "platform_status.medium.published": true } }, { $count: "count" }],
        devto: [{ $match: { "platform_status.devto.published": true } }, { $count: "count" }],
        wordpress: [{ $match: { "platform_status.wordpress.published": true } }, { $count: "count" }],
        linkedin: [{ $match: { "platform_status.linkedin.published": true } }, { $count: "count" }],
      },
    },
  ]);

  const stats = results[0];
  return {
    medium: stats.medium[0]?.count || 0,
    devto: stats.devto[0]?.count || 0,
    wordpress: stats.wordpress[0]?.count || 0,
    linkedin: stats.linkedin[0]?.count || 0,
  };
}

/**
 * Get post creation activity over the last 30 days for a user
 */
export async function getDailyActivity(userId: string) {
  const thirtyDaysAgo = dayjs().subtract(30, "day").toDate();

  const activity = await Post.aggregate([
    {
      $match: {
        author: toObjectId(userId),
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
        published: {
          $sum: { $cond: [{ $eq: ["$status", POST_STATUS.PUBLISHED] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return activity.map((item) => ({
    date: item._id,
    posts: item.count,
    published: item.published,
  }));
}

/**
 * Get overall summary stats for the authenticated user
 */
export async function getAnalyticsSummary(userId: string) {
  const [status, platforms, history] = await Promise.all([
    getStatusDistribution(userId),
    getPlatformDistribution(userId),
    getDailyActivity(userId),
  ]);

  const totalPosts = Object.values(status).reduce((a, b) => a + b, 0);
  const totalPublished = status[POST_STATUS.PUBLISHED] || 0;

  return {
    summary: {
      totalPosts,
      totalPublished,
      totalDrafts: status[POST_STATUS.DRAFT] || 0,
      publishRate: totalPosts > 0 ? (totalPublished / totalPosts) * 100 : 0,
    },
    platformStats: platforms,
    history,
  };
}
