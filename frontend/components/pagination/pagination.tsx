"use client";

export const PAGINATION_WRAPPER_CLASS =
    "flex flex-col items-center gap-4 border-t border-separator -mx-4 px-4 py-6";

export type PaginationProps = {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    disabled?: boolean;
    className?: string;
};

export default function Pagination({
    page,
    totalPages,
    onPageChange,
    disabled = false,
    className = PAGINATION_WRAPPER_CLASS,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const canPrev = page > 1 && !disabled;
    const canNext = page < totalPages && !disabled;

    return (
        <div className={className}>
            <p className="text-gray-text text-button-text">
                Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    disabled={!canPrev}
                    onClick={() => canPrev && onPageChange(page - 1)}
                    className={`min-w-[100px] rounded-xl border border-input-stroke px-5 py-3 text-button-text text-gray-text cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                        canPrev ? "hover:border-dark-gray-text/50" : ""
                    }`}
                >
                    Previous
                </button>
                <button
                    type="button"
                    disabled={!canNext}
                    onClick={() => canNext && onPageChange(page + 1)}
                    className={`min-w-[100px] rounded-xl border border-input-stroke px-5 py-3 text-button-text text-gray-text cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                        canNext ? "hover:border-dark-gray-text/50" : ""
                    }`}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
