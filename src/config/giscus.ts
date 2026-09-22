export const giscusConfig = {
  repo: 'MqCreaple/mqcreaple.github.io',
  repoId: 'R_kgDOTtTv8Q',
  category: 'General',
  categoryId: 'DIC_kwDOTtTv8c4DGIZc',
} as const;

export const isGiscusConfigured = giscusConfig.categoryId.length > 0;