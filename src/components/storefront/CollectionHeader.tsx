/** Title block shared by every product listing page (Shop All, For Him, For Her, Unisex, Accessories, New In). */
export function CollectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="w-full px-[var(--lv-gutter)] pt-[clamp(24px,3.5vw,48px)] pb-[clamp(20px,2.5vw,32px)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-10">
        <h1 className="t-display m-0">{title}</h1>
        {subtitle && <p className="t-lead m-0 max-w-[440px] md:text-right md:pb-2">{subtitle}</p>}
      </div>
    </header>
  );
}
