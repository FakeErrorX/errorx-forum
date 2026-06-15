export enum ContentStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum ModerationAction {
  NONE = 'NONE',
  FLAG = 'FLAG',
  HIDE = 'HIDE',
  DELETE = 'DELETE',
  BAN_USER = 'BAN_USER',
}

export enum FlagType {
  SPAM = 'SPAM',
  INAPPROPRIATE = 'INAPPROPRIATE',
  OFFENSIVE = 'OFFENSIVE',
  COPYRIGHT = 'COPYRIGHT',
  OTHER = 'OTHER',
}

export enum FlagStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}