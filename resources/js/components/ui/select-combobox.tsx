import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/utils/styles"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SelectComboboxProps
{
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyFallback?: string;
}

export function SelectCombobox({ 
  value, 
  onChange, 
  options,
  placeholder,
  searchPlaceholder,
  emptyFallback,
}: Readonly<SelectComboboxProps>)
{
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [targetWidth, setTargetWidth] = React.useState<number | undefined>(undefined);
  const [open, setOpen] = React.useState(false);

  React.useLayoutEffect(() => {
    if (!triggerRef.current) return;

    const measure = () => {
      const el = triggerRef.current!;
      const entry = el as unknown as { borderBoxSize?: Array<{ inlineSize: number }> | { inlineSize: number } };
      const w = (Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0]?.inlineSize : entry.borderBoxSize?.inlineSize)
        ?? el.offsetWidth;
      setTargetWidth(Math.max(0, Math.round(w)));
    };

    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(triggerRef.current);

    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "px-3 py-2 w-full justify-between font-normal bg-transparent hover:bg-transparent focus:outline-none focus:ring-1 focus:ring-ring",
            value ? "hover:text-foreground text-foreground" : "hover:text-muted-foreground text-muted-foreground"
          )}
        >
          <span className="min-h-[1] min-w-[1]">
            {value
              ? options.find((framework) => framework.value === value)?.label
              : placeholder}
          </span>
          <ChevronsUpDownIcon className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: targetWidth }}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyFallback}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  keywords={[option.value, option.label]}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  {option.label}
                  <CheckIcon
                    className={cn(
                      "size-4 ml-auto",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
