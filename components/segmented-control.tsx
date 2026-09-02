type SegmentedControlProps = {
  options: string[];
  activeIndex: number;
};


export default function SegmentedControl({ options, activeIndex }: SegmentedControlProps) {
  return (
    <div className="flex w-full gap-1 rounded-[10px] bg-fond-neutre p-1">
      {options.map((label, index) => {
        const active = index === activeIndex;
        return (
          <span
            key={label}
            className={
              active
                ? "flex flex-1 items-center justify-center rounded-md bg-fond-page px-1 py-1 font-sans text-sm font-medium text-texte-principal shadow-[0_2px_4px_0_rgba(14,18,27,0.06)]"
                : "flex flex-1 items-center justify-center rounded-md px-1 py-1 font-sans text-sm font-medium text-texte-tertiaire"
            }
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
