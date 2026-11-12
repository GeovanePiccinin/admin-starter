"use client";

import { useState } from "react";
import type { PaginationState, SortingState } from "@tanstack/react-table";

import { useDebounce } from "@/hooks/use-debounce";

interface UseListControlsOptions {
  initialPageSize?: number;
  debounceDelay?: number;
}

interface UseListControlsResult<TSortField extends string> {
  search: string;
  debouncedSearch: string;
  sorting: SortingState;
  pagination: PaginationState;

  setSearch: (search: string) => void;
  setSorting: (
    sorting: SortingState | ((previous: SortingState) => SortingState),
  ) => void;
  setPagination: (
    pagination:
      PaginationState | ((previous: PaginationState) => PaginationState),
  ) => void;

  setSort: (field: TSortField, descending?: boolean) => void;

  resetPagination: () => void;
}

export function useListControls<TSortField extends string>(
  options: UseListControlsOptions = {},
): UseListControlsResult<TSortField> {
  const { initialPageSize = 10, debounceDelay = 400 } = options;

  const [search, setSearchState] = useState("");

  const [sorting, setSortingState] = useState<SortingState>([]);

  const [pagination, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const debouncedSearch = useDebounce(search, debounceDelay);

  function setSearch(value: string): void {
    setSearchState(value);

    setPaginationState((current) => {
      if (current.pageIndex === 0) {
        return current;
      }

      return {
        ...current,
        pageIndex: 0,
      };
    });
  }

  function setSorting(
    value: SortingState | ((previous: SortingState) => SortingState),
  ): void {
    setSortingState(value);

    setPaginationState((current) => {
      if (current.pageIndex === 0) {
        return current;
      }

      return {
        ...current,
        pageIndex: 0,
      };
    });
  }

  function setPagination(
    value: PaginationState | ((previous: PaginationState) => PaginationState),
  ): void {
    setPaginationState(value);
  }

  function setSort(field: TSortField, descending = false): void {
    setSortingState([
      {
        id: field,
        desc: descending,
      },
    ]);

    setPaginationState((current) => {
      if (current.pageIndex === 0) {
        return current;
      }

      return {
        ...current,
        pageIndex: 0,
      };
    });
  }

  function resetPagination(): void {
    setPaginationState((current) => ({
      ...current,
      pageIndex: 0,
    }));
  }

  return {
    search,
    debouncedSearch,
    sorting,
    pagination,

    setSearch,
    setSorting,
    setPagination,

    setSort,

    resetPagination,
  };
}
