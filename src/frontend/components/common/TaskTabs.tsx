interface Tab<T extends string> {
    value: T;
    label: string;
}

interface Props<T extends string> {
    value: T;
    tabs: Tab<T>[];
    onChange: (value: T) => void;
    disabled?: boolean;
}

export function TaskTabs<T extends string>({ value, tabs, onChange, disabled }: Props<T>) {
    return (
        <nav aria-label="Task" className="flex gap-1 border-b border-line bg-paper px-3">
            {tabs.map((t) => {
                const active = t.value === value;
                return (
                    <button
                        key={t.value}
                        type="button"
                        aria-pressed={active}
                        disabled={disabled}
                        onClick={() => onChange(t.value)}
                        className={
                            "-mb-px border-b-2 px-2.5 py-2.5 text-sm font-medium transition-colors " +
                            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink " +
                            "disabled:opacity-50 " +
                            (active
                                ? "border-ink text-ink"
                                : "border-transparent text-muted hover:text-ink")
                        }
                    >
                        {t.label}
                    </button>
                );
            })}
        </nav>
    );
}