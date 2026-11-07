'use strict';

const { z } = require('zod');

const httpsUrl = z
  .string()
  .url()
  .refine((value) => value.startsWith('https://'), {
    message: 'Media URLs must use HTTPS',
  });

const listPostsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['gist', 'news', 'event']).optional(),
  campusId: z.string().uuid().optional(),
  authorUserId: z.string().uuid().optional(),
  q: z.string().min(2).max(100).optional(),
  sort: z.enum(['latest', 'popular']).default('latest'),
});

const createPostSchema = z
  .object({
    campusId: z.string().uuid().optional(),
    type: z.enum(['gist', 'news', 'event']).default('gist'),
    title: z.string().min(3).max(160).optional(),
    body: z.string().min(1).max(5000),
    mediaRefs: z.array(httpsUrl).max(5).optional(),
    tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  })
  .refine((value) => value.type === 'gist' || Boolean(value.title), {
    message: 'A title is required for news and event posts',
    path: ['title'],
  });

const postParams = z.object({
  id: z.string().uuid(),
});

const commentParams = z.object({
  id: z.string().uuid(),
  commentId: z.string().uuid(),
});

const createCommentSchema = z.object({
  body: z.string().min(1).max(1000),
});

module.exports = {
  listPostsQuery,
  createPostSchema,
  postParams,
  commentParams,
  createCommentSchema,
};
