import { useState, useCallback, useMemo } from 'react';
import type { OrderItem, ItemTransaction } from '../types/orderEntry';
import { mockProducts } from '../mock/orders/mockProducts';

let nextItemId = 1;
let nextTxnId = 1;
function itemId(): string { return `item-${nextItemId++}`; }
function txnId(): string { return `txn-${nextTxnId++}`; }

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function defaultCancelDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

function makeDefaultTransaction(): ItemTransaction {
  return {
    id: txnId(),
    qty: 1,
    uom: 'EA',
    unit_price: 0,
    store_number: '',
    ship_date: todayISO(),
    cancel_date: defaultCancelDate(),
  };
}

export interface ItemTotals {
  itemId: string;
  qty: number;
  extended: number;
}

export interface UseOrderItemsReturn {
  hasItems: boolean;
  setHasItems: (v: boolean) => void;
  items: OrderItem[];
  addItem: (productId: string) => void;
  removeItem: (itemId: string) => void;
  updateItemField: (itemId: string, field: 'upc' | 'description', value: string) => void;
  addTransaction: (itemId: string) => void;
  removeTransaction: (itemId: string, txnId: string) => void;
  updateTransaction: (
    itemId: string,
    txnId: string,
    field: keyof ItemTransaction,
    value: string | number,
  ) => void;
  itemTotals: ItemTotals[];
  orderTotal: number;
  orderQty: number;
}

export function useOrderItems(): UseOrderItemsReturn {
  const [hasItems, setHasItems] = useState(true);
  const [items, setItems] = useState<OrderItem[]>([]);

  const addItem = useCallback((productId: string) => {
    const product = mockProducts.find((p) => p.id === productId);
    if (!product) return;

    setItems((prev) => {
      const lineNumber = prev.length + 1;
      const defaultTxn: ItemTransaction = {
        ...makeDefaultTransaction(),
        uom: product.default_uom,
        unit_price: product.default_price,
      };
      const item: OrderItem = {
        id: itemId(),
        line_number: lineNumber,
        product_id: product.id,
        upc: product.upc,
        description: product.description,
        transactions: [defaultTxn],
      };
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((targetId: string) => {
    setItems((prev) =>
      prev
        .filter((it) => it.id !== targetId)
        .map((it, idx) => ({ ...it, line_number: idx + 1 })),
    );
  }, []);

  const updateItemField = useCallback(
    (targetId: string, field: 'upc' | 'description', value: string) => {
      setItems((prev) =>
        prev.map((it) => (it.id === targetId ? { ...it, [field]: value } : it)),
      );
    },
    [],
  );

  const addTransaction = useCallback((targetItemId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== targetItemId) return it;
        const product = mockProducts.find((p) => p.id === it.product_id);
        const txn: ItemTransaction = {
          ...makeDefaultTransaction(),
          uom: product?.default_uom ?? 'EA',
          unit_price: product?.default_price ?? 0,
        };
        return { ...it, transactions: [...it.transactions, txn] };
      }),
    );
  }, []);

  const removeTransaction = useCallback((targetItemId: string, targetTxnId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== targetItemId) return it;
        return { ...it, transactions: it.transactions.filter((t) => t.id !== targetTxnId) };
      }),
    );
  }, []);

  const updateTransaction = useCallback(
    (
      targetItemId: string,
      targetTxnId: string,
      field: keyof ItemTransaction,
      value: string | number,
    ) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== targetItemId) return it;
          return {
            ...it,
            transactions: it.transactions.map((txn) => {
              if (txn.id !== targetTxnId) return txn;
              if (field === 'qty') {
                const n = typeof value === 'string' ? parseInt(value, 10) || 0 : value;
                return { ...txn, qty: Math.max(0, n) };
              }
              if (field === 'unit_price') {
                const n = typeof value === 'string' ? parseFloat(value) || 0 : value;
                return { ...txn, unit_price: Math.max(0, Math.round(n * 100) / 100) };
              }
              return { ...txn, [field]: value };
            }),
          };
        }),
      );
    },
    [],
  );

  const itemTotals = useMemo<ItemTotals[]>(
    () =>
      items.map((it) => {
        let qty = 0;
        let extended = 0;
        for (const t of it.transactions) {
          qty += t.qty;
          extended += t.qty * t.unit_price;
        }
        return {
          itemId: it.id,
          qty,
          extended: Math.round(extended * 100) / 100,
        };
      }),
    [items],
  );

  const orderTotal = useMemo(
    () => Math.round(itemTotals.reduce((s, t) => s + t.extended, 0) * 100) / 100,
    [itemTotals],
  );

  const orderQty = useMemo(
    () => itemTotals.reduce((s, t) => s + t.qty, 0),
    [itemTotals],
  );

  return {
    hasItems,
    setHasItems,
    items,
    addItem,
    removeItem,
    updateItemField,
    addTransaction,
    removeTransaction,
    updateTransaction,
    itemTotals,
    orderTotal,
    orderQty,
  };
}
