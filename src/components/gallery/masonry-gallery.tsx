"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageTile } from "./image-tile";
import type { GalleryImage } from "@/features/gallery";
import type { ImageLoadStatus } from "@/features/images";
import { distributeMasonryItems } from "@/features/gallery/masonry-layout";

type GalleryTileHandlers = {
  mode?: "viewer" | "management";
  selectedIds?: Set<string>;
  onOpen: (id: string) => void;
  onToggleSelection?: (id: string) => void;
  onLoadStatus: (id: string, status: ImageLoadStatus) => void;
};

type MasonryGalleryProps = GalleryTileHandlers & { images: GalleryImage[] };

function columnCountForWidth(width: number): number {
  if (width >= 1536) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

function useMasonryColumnCount() {
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    const update = () => setColumnCount(columnCountForWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return columnCount;
}

export function MasonryGallery({ images, mode = "viewer", selectedIds, onOpen, onToggleSelection, onLoadStatus }: MasonryGalleryProps) {
  const columnCount = useMasonryColumnCount();
  const columns = useMemo(() => distributeMasonryItems(images, columnCount), [columnCount, images]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {columns.map((column, columnIndex) => (
        <div className="flex min-w-0 flex-col gap-4" key={columnIndex}>
          {column.map((image) => (
            <div key={image.id}>
              <ImageTile image={image} isSelected={selectedIds?.has(image.id)} mode={mode} onLoadStatus={onLoadStatus} onOpen={onOpen} onToggleSelection={onToggleSelection} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
