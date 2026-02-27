export const queryKeys = {
  trees: {
    all: ['trees'],
    mine: () => ['trees', 'mine'],
    explore: () => ['trees', 'explore'],
    detail: (treeId) => ['trees', treeId],
    meta: (treeId) => ['trees', treeId, 'meta'],
  },
  entities: {
    list: (treeId, type, params) => ['trees', treeId, type, params],
    detail: (treeId, type, id) => ['trees', treeId, type, 'detail', id],
  },
  analytics: {
    givenNames: (treeId) => ['trees', treeId, 'analytics', 'given-names'],
    surnames: (treeId) => ['trees', treeId, 'analytics', 'surnames'],
  },
  threads: {
    list: (treeId) => ['trees', treeId, 'most-wanted'],
    detail: (treeId, threadId) => ['trees', treeId, 'most-wanted', threadId],
    posts: (treeId, threadId) => ['trees', treeId, 'most-wanted', threadId, 'posts'],
    comments: (treeId, threadId, postId) => ['trees', treeId, 'most-wanted', threadId, 'posts', postId, 'comments'],
  },
  admin: {
    users: (params) => ['admin', 'users', params],
    userDetail: (userId) => ['admin', 'users', userId],
    trees: (params) => ['admin', 'trees', params],
    treeDetail: (treeId) => ['admin', 'trees', treeId],
    requests: () => ['admin', 'requests'],
  },
  dashboard: {
    stats: () => ['dashboard', 'stats'],
  },
  auth: {
    currentUser: () => ['auth', 'currentUser'],
  },
  comments: {
    list: (entityType, entityId) => ['comments', entityType, entityId],
  },
  me: {
    recipes: (params) => ['me', 'recipes', params],
    feed: (params) => ['me', 'feed', params],
    media: (params) => ['me', 'media', params],
  },
  messages: {
    conversations: () => ['messages', 'conversations'],
    conversation: (id) => ['messages', 'conversation', id],
    unread: () => ['messages', 'unread'],
    groups: () => ['messages', 'groups'],
    groupDetail: (id) => ['messages', 'group', id],
  },
  profile: {
    current: () => ['profile', 'current'],
    user: (userId) => ['profile', 'user', userId],
    followers: () => ['profile', 'followers'],
    following: () => ['profile', 'following'],
  },
};
