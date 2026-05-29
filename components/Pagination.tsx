"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";

type PaginationLabels = {
  show: string;
  page: string;
  of: string;
};

type Props = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  labels?: PaginationLabels;
};

const defaultLabels: PaginationLabels = {
  show: "Prikaži",
  page: "Strana",
  of: "od"
};

export default function Pagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [15, 30, 50, 100],
  labels = defaultLabels
}: Props) {
  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setPageInput("");
      return;
    }
    if (!/^\d+$/.test(val)) return;
    setPageInput(val);
  };

  const commitPage = () => {
    const num = parseInt(pageInput, 10);
    if (!num || num < 1) {
      onPageChange(1);
      setPageInput("1");
    } else if (num > totalPages) {
      onPageChange(totalPages);
      setPageInput(String(totalPages));
    } else {
      onPageChange(num);
      setPageInput(String(num));
    }
  };

  if (totalPages <= 1) return null;

  const btnClass =
    "p-1.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap text-sm pt-4 border-t border-white/5 mt-4">
      <div className="flex items-center gap-1.5">
        <label className="text-white/50 text-xs">{labels.show}:</label>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="glass-input text-xs py-1 px-2 w-auto"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className={btnClass}
          aria-label="First page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={btnClass}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <span className="text-white/50 text-xs px-1">{labels.page}</span>
        <input
          type="text"
          inputMode="numeric"
          value={pageInput}
          onChange={handlePageInputChange}
          onBlur={commitPage}
          onKeyDown={(e) => e.key === "Enter" && commitPage()}
          className="glass-input w-12 text-center text-xs py-1"
        />
        <span className="text-white/50 text-xs px-1">
          {labels.of} {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={btnClass}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className={btnClass}
          aria-label="Last page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
