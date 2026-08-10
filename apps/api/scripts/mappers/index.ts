import {
  asBoolean,
  asNumber,
  asOptionalString,
  asString,
  legacyId,
  mediaPath,
  mediaRef,
} from './common';

export function mapRole(item: Record<string, unknown>) {
  return {
    legacyId: legacyId(item),
    title: asString(item.title ?? item.name, 'untitled'),
    permissions: item.permissions ?? [],
  };
}

export function mapUser(item: Record<string, unknown>) {
  return {
    legacyId: legacyId(item),
    phone: asString(item.phone ?? item.mobile),
    firstName: asOptionalString(item.firstName ?? item.name),
    lastName: asOptionalString(item.lastName ?? item.family),
    nickname: asOptionalString(item.nickname ?? item.nickName),
    media: mediaRef(item.imageRef ?? item.image ?? item.avatar),
    roleLegacyId: legacyId(
      (item.role_id as Record<string, unknown>) ||
        (item.role as Record<string, unknown>) ||
        {}
    ),
  };
}

export function mapProductCategory(item: Record<string, unknown>) {
  const parent = item.parent_id as Record<string, unknown> | string | null;
  return {
    legacyId: legacyId(item),
    title: asString(item.title),
    slug: asString(item.slug),
    description: asOptionalString(item.description),
    publish: asBoolean(item.publish, true),
    sortOrder: asNumber(item.priority ?? item.sortOrder, 0),
    parentLegacyId:
      typeof parent === 'string'
        ? parent
        : parent
          ? legacyId(parent)
          : null,
  };
}

export function mapProduct(item: Record<string, unknown>) {
  const categories = Array.isArray(item.category_id)
    ? item.category_id
    : item.category_id
      ? [item.category_id]
      : [];

  return {
    legacyId: legacyId(item),
    title: asString(item.title),
    slug: asString(item.slug),
    subtitle: asOptionalString(item.subtitle),
    description: asOptionalString(item.description),
    media: mediaRef(item.thumbnail_id),
    gallery: Array.isArray(item.gallery)
      ? (item.gallery as unknown[])
          .map((g) => mediaRef(g))
          .filter(Boolean)
      : [],
    isFeatured: asBoolean(item.isFeatured ?? item.featured, false),
    status:
      asString(item.status, 'AVAILABLE').toUpperCase() === 'AVAILABLE'
        ? 'AVAILABLE'
        : 'UNAVAILABLE',
    views: asNumber(item.views, 0),
    sortOrder: asNumber(item.priority ?? item.sortOrder, 0),
    categoryLegacyIds: categories
      .map((c) =>
        typeof c === 'string' ? c : legacyId(c as Record<string, unknown>)
      )
      .filter(Boolean) as string[],
  };
}

export function mapPackage(item: Record<string, unknown>) {
  const product = item.product_id as Record<string, unknown> | string | null;
  return {
    legacyId: legacyId(item),
    value: asNumber(item.value, 0),
    unit: asString(item.unit, 'unit'),
    productLegacyId:
      typeof product === 'string'
        ? product
        : product
          ? legacyId(product)
          : null,
  };
}

export function mapSpecification(item: Record<string, unknown>) {
  const position = asString(item.position, 'attribute');
  return {
    legacyId: legacyId(item),
    title: asString(item.title),
    position: position === 'extra' ? 'extra' : 'attribute',
  };
}

export function mapProductSpecification(item: Record<string, unknown>) {
  const product = item.product_id as Record<string, unknown> | string | null;
  const spec = item.specification_id as Record<string, unknown> | string | null;
  return {
    legacyId: legacyId(item),
    value: asString(item.value),
    highlight: asBoolean(item.highlight, false),
    sortOrder: asNumber(item.sortOrder ?? item.priority, 0),
    productLegacyId:
      typeof product === 'string'
        ? product
        : product
          ? legacyId(product)
          : null,
    specificationLegacyId:
      typeof spec === 'string' ? spec : spec ? legacyId(spec) : null,
  };
}

export function mapTagCategory(item: Record<string, unknown>) {
  return {
    legacyId: legacyId(item),
    title: asString(item.title),
    slug: asString(item.slug || item.title),
  };
}

export function mapTag(item: Record<string, unknown>) {
  const category = item.category_id as Record<string, unknown> | string | null;
  return {
    legacyId: legacyId(item),
    title: asString(item.title),
    slug: asString(item.slug || item.title),
    categoryLegacyId:
      typeof category === 'string'
        ? category
        : category
          ? legacyId(category)
          : null,
  };
}

export function mapBlogCategory(item: Record<string, unknown>) {
  const parent = item.parent_id as Record<string, unknown> | string | null;
  return {
    legacyId: legacyId(item),
    title: asString(item.title),
    slug: asString(item.slug),
    description: asOptionalString(item.description),
    publish: asBoolean(item.publish, true),
    media: mediaRef(item.thumbnail_id),
    parentLegacyId:
      typeof parent === 'string'
        ? parent
        : parent
          ? legacyId(parent)
          : null,
  };
}

export function mapBlog(item: Record<string, unknown>) {
  const category = item.category_id as Record<string, unknown> | string | null;
  const author = item.author_id as Record<string, unknown> | string | null;
  const status = asString(item.status, 'draft');
  return {
    legacyId: legacyId(item),
    title: asString(item.title),
    slug: asString(item.slug),
    content: asOptionalString(item.content),
    status: status === 'published' ? 'published' : 'draft',
    media: mediaRef(item.thumbnail_id),
    categoryLegacyId:
      typeof category === 'string'
        ? category
        : category
          ? legacyId(category)
          : null,
    authorLegacyId:
      typeof author === 'string'
        ? author
        : author
          ? legacyId(author)
          : null,
  };
}

export function mapComment(item: Record<string, unknown>) {
  const targetType = asString(item.targetType, 'product');
  const target = item.target_id as Record<string, unknown> | string | null;
  const parent = item.parent_id as Record<string, unknown> | string | null;
  const targetLegacyId =
    typeof target === 'string' ? target : target ? legacyId(target) : null;

  return {
    legacyId: legacyId(item),
    nickName: asString(item.nickName ?? item.fullName, 'ناشناس'),
    content: asString(item.content ?? item.message),
    email: asOptionalString(item.email),
    website: asOptionalString(item.website),
    rating: item.rating == null ? null : asNumber(item.rating),
    publish: asBoolean(item.publish, false),
    targetType:
      targetType === 'blog' || targetType === 'comment' ? targetType : 'product',
    targetLegacyId,
    parentLegacyId:
      typeof parent === 'string'
        ? parent
        : parent
          ? legacyId(parent)
          : null,
  };
}

export function mapSeo(item: Record<string, unknown>) {
  const keywords = item.metaKeyWords ?? item.keywords;
  return {
    legacyId: legacyId(item),
    targetPath: asOptionalString(item.targetPath),
    targetType: asOptionalString(item.targetType),
    targetLegacyId: asOptionalString(
      item.target_id ?? item.targetId ?? item.refId
    ),
    metaTitle: asOptionalString(item.metaTitle),
    metaDescription: asOptionalString(item.metaDescription),
    metaKeyWords: Array.isArray(keywords)
      ? keywords.map(String)
      : typeof keywords === 'string'
        ? keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : [],
    canonicalUrl: asOptionalString(item.canonicalUrl),
  };
}

export function mapMedia(item: Record<string, unknown>) {
  return {
    legacyId: legacyId(item),
    url: asString(item.url),
    type: asOptionalString(item.type),
    name: asOptionalString(item.name ?? item.filename),
    alt: asOptionalString(item.alt ?? item.altText ?? item.name ?? item.filename),
    mimeType: asOptionalString(item.mimeType ?? item.mimetype),
    size: item.size == null ? null : asNumber(item.size),
  };
}

export function mapContact(item: Record<string, unknown>) {
  return {
    legacyId: legacyId(item),
    fullName: asOptionalString(item.fullName ?? item.name),
    subject: asOptionalString(item.subject),
    email: asOptionalString(item.email),
    phone: asOptionalString(item.phone),
    message: asString(item.message ?? item.content),
  };
}
