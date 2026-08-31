import { MasonryGallery } from "./masonry-gallery";
import { SquareGallery } from "./square-gallery";
import type { GalleryImage, GalleryView } from "@/features/gallery";
import type { ImageLoadStatus } from "@/features/images";

type ManagementGalleryProps = {
  images: GalleryImage[];
  selectedIds: Set<string>;
  view: GalleryView;
  onToggleSelection: (id: string) => void;
  onLoadStatus: (id: string, status: ImageLoadStatus) => void;
};

export function ManagementGallery({ images, selectedIds, view, onToggleSelection, onLoadStatus }: ManagementGalleryProps) {
  const props = {
    images,
    mode: "management" as const,
    selectedIds,
    onOpen: () => undefined,
    onToggleSelection,
    onLoadStatus,
  };
  return view === "masonry" ? <MasonryGallery {...props} /> : <SquareGallery {...props} />;
}
