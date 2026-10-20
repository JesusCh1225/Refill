/** 커뮤니티 댓글/게시글 author select (id 포함) */
export const AUTHOR_SELECT = {
  id: true,
  nickname: true,
  name: true,
  avatarUrl: true,
  oauthImageUrl: true,
} as const;

/** 포스트 댓글 author select (id 없음 — postMapper.ts 기준) */
export const COMMENT_AUTHOR_SELECT = {
  name: true,
  nickname: true,
  avatarUrl: true,
  oauthImageUrl: true,
} as const;
