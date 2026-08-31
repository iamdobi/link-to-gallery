import { ImageTile } from "./image-tile";
import type { GalleryImage } from "@/features/gallery";
import type { ImageLoadStatus } from "@/features/images";

type GalleryTileHandlers = {
  onOpen: (id: string) => void;
  onLoadStatus: (id: string, status: ImageLoadStatus) => void;
};

type MasonryGalleryProps = GalleryTileHandlers & { images: GalleryImage[] };

export function MasonryGallery({ images, onOpen, onLoadStatus }: MasonryGalleryProps) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 2xl:columns-4">
      {images.map((image) => (
        <div className="mb-4 break-inside-avoid" key={image.id} style={{ contentVisibility: "auto" }}>
          <ImageTile image={image} mode="viewer" onLoadStatus={onLoadStatus} onOpen={onOpen} />
        </div>
      ))}
    </div>
  );
}
