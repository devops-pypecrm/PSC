import { ObjectId, type Collection, type Document } from "mongodb";

export type OrderedSuccessVideoDocument = Document & {
  _id: ObjectId;
  order?: number;
};

function hasValidOrder(
  video: OrderedSuccessVideoDocument
): video is OrderedSuccessVideoDocument & { order: number } {
  return (
    typeof video.order === "number" &&
    Number.isFinite(video.order) &&
    video.order >= 0
  );
}

export async function getOrderedSuccessVideos(
  collection: Collection<OrderedSuccessVideoDocument>
): Promise<OrderedSuccessVideoDocument[]> {
  const videos = await collection.find({}).sort({ createdAt: -1 }).toArray();
  const orderedVideos = videos.filter(hasValidOrder);
  const videosWithoutOrder = videos.filter((video) => !hasValidOrder(video));

  if (videosWithoutOrder.length > 0) {
    let nextOrder =
      orderedVideos.length > 0
        ? Math.max(...orderedVideos.map((video) => video.order)) + 1
        : 0;

    await collection.bulkWrite(
      videosWithoutOrder.map((video) => {
        const order = nextOrder++;
        const orderFilter =
          typeof video.order === "number"
            ? { order: video.order }
            : { order: { $exists: false } };

        return {
          updateOne: {
            filter: { _id: video._id, ...orderFilter },
            update: { $set: { order } },
          },
        };
      })
    );
  }

  return collection.find({}).sort({ order: 1, _id: 1 }).toArray();
}

export async function compactSuccessVideoOrder(
  collection: Collection<OrderedSuccessVideoDocument>
): Promise<void> {
  const videos = await getOrderedSuccessVideos(collection);
  if (videos.length === 0) return;

  await collection.bulkWrite(
    videos.map((video, order) => ({
      updateOne: {
        filter: { _id: video._id },
        update: { $set: { order } },
      },
    }))
  );
}
