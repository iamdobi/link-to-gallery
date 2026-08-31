"use client";

import { useCallback, useReducer } from "react";
import { defaultGalleryFilters, type GalleryFilters, type GalleryImage, type GalleryPage, type GalleryState } from "./types";

type GalleryAction =
  | { type: "filters"; filters: GalleryFilters }
  | { type: "replace-page"; page: GalleryPage }
  | { type: "append-page"; page: GalleryPage }
  | { type: "toggle-selection"; imageId: string }
  | { type: "clear-selection" }
  | { type: "set-selection"; imageIds: Set<string> }
  | { type: "set-scroll"; scrollY: number }
  | { type: "update-image"; image: GalleryImage };

function dataFiltersChanged(current: GalleryFilters, next: GalleryFilters): boolean {
  return current.search !== next.search
    || current.folderId !== next.folderId
    || current.tagMode !== next.tagMode
    || current.inboxOnly !== next.inboxOnly
    || current.loadStatus !== next.loadStatus
    || current.trashOnly !== next.trashOnly
    || current.tagIds.length !== next.tagIds.length
    || current.tagIds.some((tagId, index) => tagId !== next.tagIds[index]);
}

function reducer(state: GalleryState, action: GalleryAction): GalleryState {
  switch (action.type) {
    case "filters": {
      if (!dataFiltersChanged(state.filters, action.filters)) {
        return { ...state, filters: action.filters };
      }

      return { ...state, filters: action.filters, items: [], nextCursor: null, selectedIds: new Set() };
    }
    case "replace-page":
      return { ...state, items: action.page.items, nextCursor: action.page.nextCursor };
    case "append-page":
      return { ...state, items: [...state.items, ...action.page.items], nextCursor: action.page.nextCursor };
    case "toggle-selection": {
      const selectedIds = new Set(state.selectedIds);
      if (selectedIds.has(action.imageId)) selectedIds.delete(action.imageId);
      else selectedIds.add(action.imageId);
      return { ...state, selectedIds };
    }
    case "clear-selection":
      return { ...state, selectedIds: new Set() };
    case "set-selection":
      return { ...state, selectedIds: new Set(action.imageIds) };
    case "set-scroll":
      return { ...state, scrollY: action.scrollY };
    case "update-image":
      return {
        ...state,
        items: state.items.map((image) => image.id === action.image.id ? action.image : image),
      };
  }
}

type UseGalleryStateOptions = {
  initialFilters?: Partial<GalleryFilters>;
  initialPage?: GalleryPage;
};

export function useGalleryState(options: UseGalleryStateOptions = {}) {
  const [state, dispatch] = useReducer(reducer, {
    filters: { ...defaultGalleryFilters, ...options.initialFilters },
    items: options.initialPage?.items ?? [],
    nextCursor: options.initialPage?.nextCursor ?? null,
    selectedIds: new Set<string>(),
    scrollY: 0,
  });

  const setFilters = useCallback((updates: Partial<GalleryFilters>) => {
    dispatch({ type: "filters", filters: { ...state.filters, ...updates } });
  }, [state.filters]);

  const replacePage = useCallback((page: GalleryPage) => dispatch({ type: "replace-page", page }), []);
  const appendPage = useCallback((page: GalleryPage) => dispatch({ type: "append-page", page }), []);
  const toggleSelection = useCallback((imageId: string) => dispatch({ type: "toggle-selection", imageId }), []);
  const clearSelection = useCallback(() => dispatch({ type: "clear-selection" }), []);
  const setSelection = useCallback((imageIds: Set<string>) => dispatch({ type: "set-selection", imageIds }), []);
  const saveScrollPosition = useCallback((scrollY: number) => dispatch({ type: "set-scroll", scrollY }), []);
  const updateImage = useCallback((image: GalleryImage) => dispatch({ type: "update-image", image }), []);

  return {
    ...state,
    setFilters,
    replacePage,
    appendPage,
    toggleSelection,
    clearSelection,
    setSelection,
    saveScrollPosition,
    updateImage,
  };
}
