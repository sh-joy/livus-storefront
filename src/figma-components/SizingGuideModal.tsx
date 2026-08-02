'use client';
import { motion, AnimatePresence } from "framer-motion";
import { useDrawer } from "./DrawerContext";

export interface SizeMatrixRow {
  label: string;
  S: string;
  M: string;
  L: string;
  XL: string;
  XXL: string;
}

function Row({ label, bold }: { label: string; bold?: boolean }) {
  return (
    <div className="content-stretch flex items-center justify-center py-[12px] relative shrink-0 w-full">
      <div aria-hidden className="absolute border-[#e2e2e2] border-b border-solid inset-0 pointer-events-none" />
      <p className={`[word-break:break-word] flex-[1_0_0] ${bold ? "font-sans font-medium" : "font-sans"} leading-[24px] min-w-px not-italic relative text-[#1a1a1a] text-[15px] tracking-[-0.085px]`}>
        {label}
      </p>
    </div>
  );
}

function Cell({ value, bold }: { value: string; bold?: boolean }) {
  return (
    <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0">
      <div aria-hidden className="absolute border-[#e2e2e2] border-b border-solid inset-0 pointer-events-none" />
      <p className={`[word-break:break-word] ${bold ? "font-sans font-medium" : "font-sans"} leading-[24px] not-italic relative shrink-0 text-[#1a1a1a] text-[15px] tracking-[-0.085px] min-w-[36px] text-center`}>
        {value}
      </p>
    </div>
  );
}

// Fallback Default Size Matrix
const defaultSizes: SizeMatrixRow[] = [
  { label: "Garment Length", S: '25"', M: '25.5"', L: '26"', XL: '26.5"', XXL: '27"' },
  { label: "Body / Chest", S: '19"', M: '20"', L: '21"', XL: '22"', XXL: '23"' },
  { label: "Sleeve Length", S: '8.5"', M: '9"', L: '9.5"', XL: '10"', XXL: '10.5"' },
];

interface SizingGuideModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  sizeMatrix?: SizeMatrixRow[];
  productName?: string;
}

export function SizingGuideModal({ isOpen, onClose, sizeMatrix, productName }: SizingGuideModalProps = {}) {
  const { sizingGuideOpen, closeSizingGuide } = useDrawer();

  const isVisible = isOpen !== undefined ? isOpen : sizingGuideOpen;
  const handleClose = onClose !== undefined ? onClose : closeSizingGuide;

  const matrix = (sizeMatrix && sizeMatrix.length > 0) ? sizeMatrix : defaultSizes;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white content-stretch flex flex-col gap-[16px] items-center overflow-clip p-[24px] w-[580px] max-w-[calc(100vw-32px)] shadow-2xl rounded-none font-sans"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "tween", duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full border-b border-neutral-200 pb-3">
              <div>
                <h3 className="font-sans font-semibold text-[#1a1a1a] text-[20px]">
                  {productName ? `${productName} - Size Guide` : "Size Guide"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Exact garment measurements in inches (in)</p>
              </div>
              <button
                onClick={handleClose}
                className="relative shrink-0 size-7 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                aria-label="Close"
              >
                <svg className="size-4" fill="none" height="20" viewBox="0 0 20 20" width="20">
                  <path d="M15 5L5 15" stroke="black" strokeLinejoin="round" strokeWidth="1.5" />
                  <path d="M5 5L15 15" stroke="black" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </button>
            </div>

            {/* Dynamic Product-Specific Measurement Table */}
            <div className="content-stretch flex items-center relative shrink-0 w-full pt-1">
              {/* Left Column: Measurement Labels */}
              <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative">
                <Row label="Size" bold />
                {matrix.map((row, idx) => (
                  <Row key={idx} label={row.label} />
                ))}
              </div>

              {/* Right Columns: Sizes S, M, L, XL, XXL */}
              <div className="content-stretch flex items-center relative shrink-0">
                {(["S", "M", "L", "XL", "XXL"] as const).map((sz) => (
                  <div key={sz} className="content-stretch flex flex-col items-start relative shrink-0">
                    <Cell value={sz} bold />
                    {matrix.map((row, idx) => (
                      <Cell key={idx} value={row[sz] || 'N/A'} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
