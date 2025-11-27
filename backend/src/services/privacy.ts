import { FeedStatus, FriendshipStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function canViewFeed(
  viewerId: string | undefined,
  authorId: string,
  status: FeedStatus,
): Promise<boolean> {
  if (status === "PUBLIC") return true;

  if (!viewerId) return false;
  if (viewerId === authorId) return true;

  const relation = await prisma.friendship.findFirst({
    where: {
      requesterId: viewerId,
      targetId: authorId,
    },
  });

  if (!relation) return false;
  if (relation.status === FriendshipStatus.BLOCKED) return false;

  if (status === "FRIEND") {
    return (
      relation.status === FriendshipStatus.FRIEND ||
      relation.status === FriendshipStatus.CLOSE_FRIEND
    );
  }

  if (status === "CLOSE_FRIEND") {
    return relation.status === FriendshipStatus.CLOSE_FRIEND;
  }

  return false;
}
