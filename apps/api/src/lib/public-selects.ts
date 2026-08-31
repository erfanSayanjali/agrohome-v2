import { mergeProtectedWhere, pickPublicFilters, stripFilterKeys } from "./helpers";

export { mergeProtectedWhere, pickPublicFilters, stripFilterKeys };

export const PUBLIC_AUTHOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  nickname: true,
} as const;

export const PUBLIC_COMMENT_SELECT = {
  id: true,
  nickName: true,
  content: true,
  rating: true,
  publish: true,
  showOnHome: true,
  targetType: true,
  productId: true,
  blogId: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const PUBLIC_SEO_SELECT = {
  id: true,
  targetPath: true,
  targetType: true,
  targetLegacyId: true,
  metaTitle: true,
  metaDescription: true,
  metaKeyWords: true,
  canonicalUrl: true,
  pageId: true,
} as const;
