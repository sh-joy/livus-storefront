import { Truck, Banknote, PackageCheck } from "lucide-react";

const ITEMS = [
  { icon: Truck, title: "Nationwide delivery", text: "All 64 districts of Bangladesh" },
  { icon: Banknote, title: "Cash on delivery", text: "Pay when your order arrives" },
  { icon: PackageCheck, title: "Free delivery over ৳2,500", text: "Automatically applied at checkout" },
];

/** Reasons-to-buy row shown under the homepage hero. */
export function TrustStrip() {
  return (
    <section aria-label="Why shop with LIVUS" className="w-full border-y border-[var(--lv-line)] bg-white">
      <ul className="grid grid-cols-1 sm:grid-cols-3 list-none m-0 p-0 px-[var(--lv-gutter)]">
        {ITEMS.map(({ icon: Icon, title, text }, i) => (
          <li
            key={title}
            className={`flex items-center gap-4 py-5 sm:py-6 sm:justify-center ${
              i > 0 ? "border-t sm:border-t-0 sm:border-l border-[var(--lv-line)]" : ""
            }`}
          >
            <Icon className="size-6 shrink-0 stroke-[1.4] text-[#0d0d0d]" aria-hidden />
            <div className="min-w-0">
              <p className="t-body m-0 font-medium text-[#0d0d0d]" style={{ fontWeight: 500 }}>{title}</p>
              <p className="t-small m-0 text-[var(--lv-ink-muted)]">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
