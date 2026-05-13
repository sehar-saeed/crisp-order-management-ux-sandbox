import { useState, useMemo, useCallback } from 'react';

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function useListPagination<T>(items: T[]) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safeCurrentPage, pageSize]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  return {
    paginatedItems,
    currentPage: safeCurrentPage,
    pageSize,
    totalPages,
    totalCount: items.length,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    goToPage,
    changePageSize,
  };
}
