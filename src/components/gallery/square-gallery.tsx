"use client";

import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ImageTile } from "./image-tile";
import type { GalleryImage } from "@/features/gallery";
import type { ImageLoadStatus } from "@/features/images";

type SquareGalleryProps = {
  images: GalleryImage[];
  onOpen: (id: string) => void;
  onLoadStatus: (id: string, status: ImageLoadStatus) => void;
};

function useColumnCount() {
  const [columns, setColumns] = useState(2);
  useEffect(() => {
    const update = () => setColumns(window.innerWidth >= 1536 ? 6 : window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 3 : 2);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return columns;
}

export function SquareGallery({ images, onOpen, onLoadStatus }: SquareGalleryProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = useColumnCount();
  const rowCount = Math.ceil(images.length / columns);
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual owns DOM measurement for this grid.
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 250,
    overscan: 3,
  });

  return (
    <div className="h-[calc(100vh-10rem)] overflow-auto" ref={parentRef}>
      <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowImages = images.slice(virtualRow.index * columns, (virtualRow.index + 1) * columns);
          return (
            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6" key={virtualRow.key} style={{ position: "absolute", top: 0, transform: `translateY(${virtualRow.start}px)` }}>
              {rowImages.map((image) => (
                <div className="aspect-square overflow-hidden" key={image.id}>
                  <ImageTile compact image={image} mode="viewer" onLoadStatus={onLoadStatus} onOpen={onOpen} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
