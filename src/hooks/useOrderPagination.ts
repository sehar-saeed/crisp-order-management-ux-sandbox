import { useState, useMemo, useCallback } from 'react';
import type { OrderBrowseRow } from '../types/order';

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function useOrderPagination(orders: OrderBrowseRow[]) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return orders.slice(start, start + pageSize);
  }, [orders, safeCurrentPage, pageSize]);

  const totalAmount = useMemo(
    () => orders.reduce((sum, o) => sum + o.totalAmount, 0),
    [orders]
  );

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  return {
    paginatedOrders,
    currentPage: safeCurrentPage,
    pageSize,
    totalPages,
    totalOrders: orders.length,
    totalAmount,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    goToPage,
    changePageSize,
  };
}
