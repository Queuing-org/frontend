type UserLike = {
  slug?: string | null;
};

function getPublicUserSlug(user: UserLike | null | undefined) {
  const slug = user?.slug;

  return slug?.trim() || null;
}

export function isSameUser(
  left: UserLike | null | undefined,
  right: UserLike | null | undefined,
) {
  if (!left || !right) {
    return false;
  }

  const leftSlug = getPublicUserSlug(left);
  const rightSlug = getPublicUserSlug(right);
  return Boolean(leftSlug && rightSlug && leftSlug === rightSlug);
}

export function isRoomOwner(
  owner: UserLike | null | undefined,
  user: UserLike | null | undefined,
) {
  return isSameUser(owner, user);
}
