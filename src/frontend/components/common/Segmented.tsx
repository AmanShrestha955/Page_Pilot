interface Option<T extends string> {
    value: T;
    label: string;
}

interface Props<T extends string> {
    label: string;
    value: T;
    options: Option<T>[];
    onChange: (value: T) => void;
    disabled?: boolean;
}

export function Segmented<T extends string>({
    label,
    value,
    options,
    onChange,
    disabled,
}: Props<T>) {
    return (
        <div>
            <p className="mb-1.5 text-xs font-medium text-muted">{label}</p>
            <div
                role="radiogroup"
                aria-label={label}
                className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-lg bg-canvas p-0.5 ring-1 ring-line"
            >
                {options.map((o) => {
                    const active = o.value === value;
                    return (
                        <button
                            key={o.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={disabled}
                            onClick={() => onChange(o.value)}
                            className={
                                "rounded-md px-2 py-1.5 text-xs font-medium transition-colors " +
                                "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink " +
                                "disabled:opacity-50 " +
                                (active
                                    ? "bg-paper text-ink shadow-sm ring-1 ring-line"
                                    : "text-muted hover:text-ink")
                            }
                        >
                            {o.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}