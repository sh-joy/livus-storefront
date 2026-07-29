'use client';
import { motion, AnimatePresence } from "framer-motion";
import { useDrawer } from "./DrawerContext";

function Row({ label, bold }: { label: string; bold?: boolean }) {
  return (
    <div className="content-stretch flex items-center justify-center py-[12px] relative shrink-0 w-full">
      <div aria-hidden className="absolute border-[#e2e2e2] border-b border-solid inset-0 pointer-events-none" />
      <p className={`[word-break:break-word] flex-[1_0_0] ${bold ? "font-sans font-medium" : "font-sans"} leading-[24px] min-w-px not-italic relative text-[#1a1a1a] text-[17px] tracking-[-0.085px]`}>
        {label}
      </p>
    </div>
  );
}

function Cell({ value, bold }: { value: string; bold?: boolean }) {
  return (
    <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0">
      <div aria-hidden className="absolute border-[#e2e2e2] border-b border-solid inset-0 pointer-events-none" />
      <p className={`[word-break:break-word] ${bold ? "font-sans font-medium" : "font-sans"} leading-[24px] not-italic relative shrink-0 text-[#1a1a1a] text-[17px] tracking-[-0.085px] w-[40px]`}>
        {value}
      </p>
    </div>
  );
}

const sizes = [
  { size: "XS", length: '24.5"', body: '18"',   sleeve: '8"'   },
  { size: "S",  length: '25"',   body: '19"',   sleeve: '8.5"' },
  { size: "M",  length: '25.5"', body: '20"',   sleeve: '9"'   },
  { size: "L",  length: '26"',   body: '21"',   sleeve: '9.5"' },
  { size: "XL", length: '26.5"', body: '22"',   sleeve: '10"'  },
];

interface SizingGuideModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function SizingGuideModal({ isOpen, onClose }: SizingGuideModalProps = {}) {
  const { sizingGuideOpen, closeSizingGuide } = useDrawer();

  const isVisible = isOpen !== undefined ? isOpen : sizingGuideOpen;
  const handleClose = onClose !== undefined ? onClose : closeSizingGuide;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white content-stretch flex flex-col gap-[12px] items-center overflow-clip p-[20px] w-[560px] max-w-[calc(100vw-32px)]"
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ type: "tween", duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
              <p className="[word-break:break-word] font-sans leading-[28px] not-italic relative shrink-0 text-[#1a1a1a] text-[22px] whitespace-nowrap">Size Guide</p>
              <button onClick={handleClose} className="relative shrink-0 size-[20px] cursor-pointer" aria-label="Close">
                <svg className="absolute block inset-0 size-full" fill="none" height="20" viewBox="0 0 20 20" width="20">
                  <path d="M15 5L5 15" stroke="black" strokeLinejoin="round" strokeWidth="1.2" />
                  <path d="M5 5L15 15" stroke="black" strokeLinejoin="round" strokeWidth="1.2" />
                </svg>
              </button>
            </div>

            {/* Table: label column + size columns */}
            <div className="content-stretch flex items-center relative shrink-0 w-full">
              {/* Left: measurement labels */}
              <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative">
                <Row label="Size" bold />
                <Row label="Length" />
                <Row label="Body" />
                <Row label="Sleeve" />
              </div>

              {/* Right: one column per size */}
              <div className="content-stretch flex items-center relative shrink-0">
                {sizes.map((s) => (
                  <div key={s.size} className="content-stretch flex flex-col items-start relative shrink-0">
                    <Cell value={s.size} bold />
                    <Cell value={s.length} />
                    <Cell value={s.body} />
                    <Cell value={s.sleeve} />
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
