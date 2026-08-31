"use client";

import { useCallback, useReducer } from "react";
import { defaultGalleryFilters, type GalleryFilters, type GalleryImage, type GalleryPage, type GalleryState } from "./types";

type GalleryAction =
  | { type: "filters"; filters: GalleryFilters }
  | { type: "replace-page"; page: GalleryPage }
  | { type: "append-page"; page: GalleryPage }
  | { type: "toggle-selection"; imageId: string }
  | { type: "clear-selection" }
  | { type: "set-scroll"; scrollY: number }
  | { type: "update-image"; image: GalleryImage };

function reducer(state: GalleryState, action: GalleryAction): GalleryState {
  switch (action.type) {
    case "filters":
      return { ...state, filters: action.filters, items: [], nextCursor: null, selectedIds: new Set() };
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
  const saveScrollPosition = useCallback((scrollY: number) => dispatch({ type: "set-scroll", scrollY }), []);
  const updateImage = useCallback((image: GalleryImage) => dispatch({ type: "update-image", image }), []);

  return {
    ...state,
    setFilters,
    replacePage,
    appendPage,
    toggleSelection,
    clearSelection,
    saveScrollPosition,
    updateImage,
  };
}
