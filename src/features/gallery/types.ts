import type { ImageLoadStatus, ImageRecord } from "@/features/images";

export type GalleryView = "masonry" | "square";
export type TagMatchMode = "any" | "all";

export type GalleryFilters = {
  search: string;
  folderId: string | null;
  tagIds: string[];
  tagMode: TagMatchMode;
  inboxOnly: boolean;
  loadStatus: ImageLoadStatus | "all";
  trashOnly: boolean;
  view: GalleryView;
};

export type GalleryFolder = {
  id: string;
  name: string;
  parentId: string | null;
};

export type GalleryTag = {
  id: string;
  name: string;
  normalizedName: string;
};

export type GalleryImage = ImageRecord & {
  folders: GalleryFolder[];
  tags: GalleryTag[];
};

export type GalleryPage = {
  items: GalleryImage[];
  nextCursor: string | null;
};

export type GalleryCounts = {
  active: number;
  inbox: number;
};

export type GalleryState = {
  filters: GalleryFilters;
  items: GalleryImage[];
  nextCursor: string | null;
  selectedIds: Set<string>;
  scrollY: number;
};

export const defaultGalleryFilters: GalleryFilters = {
  search: "",
  folderId: null,
  tagIds: [],
  tagMode: "any",
  inboxOnly: false,
  loadStatus: "all",
  trashOnly: false,
  view: "masonry",
};
