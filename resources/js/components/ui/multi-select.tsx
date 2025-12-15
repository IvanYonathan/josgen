import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/utils/styles";

import * as React from "react";
import { CaretSortIcon } from "@radix-ui/react-icons";

const OPEN_KEYS = [' ', 'Enter', 'ArrowUp', 'ArrowDown'];

type MultiSelectValueType = string;

export interface MultiSelectContextType 
{
  selected: MultiSelectValueType[];
  setSelected: (value: MultiSelectValueType[]) => void;
  open: boolean;
  setOpen: (value: boolean) => void;
}

function useProviderValue(
  value?: MultiSelectValueType[], 
  setValue?: (value: MultiSelectValueType[]) => void, 
  defaultValue?: MultiSelectValueType[],
  open?: boolean,
  setOpen?: (value: boolean) => void,
  defaultOpen?: boolean
): MultiSelectContextType 
{
  const [selected, setSelected] = React.useState<MultiSelectValueType[]>(defaultValue ?? []);
  
  const [isOpen, setIsOpen] = React.useState<boolean>(defaultOpen ?? false);
  
  return { 
    selected: value ? value : selected, 
    setSelected: setValue ? setValue : setSelected,
    open: open ? open : isOpen,
    setOpen: setOpen ? setOpen : setIsOpen
  };
}

const MultiSelectContext = React.createContext<MultiSelectContextType | undefined>(undefined);
MultiSelectContext.displayName = "MultiSelectProvider";

interface MultiSelectProviderProps extends React.PropsWithChildren {
  value?: MultiSelectValueType[];
  onValueChange?: (value: MultiSelectValueType[]) => void;
  defaultValue?: MultiSelectValueType[];
  open?: boolean;
  onOpenChange?: (value: boolean) => void;
  defaultOpen?: boolean;
}

const MultiSelectProvider = ({ value, onValueChange, defaultValue, open, onOpenChange, defaultOpen, ...props }: MultiSelectProviderProps) => {
  const providerValue = useProviderValue(value, onValueChange, defaultValue, open, onOpenChange, defaultOpen);
  return <MultiSelectContext.Provider value={providerValue} {...props} />;
};

export function useMultiSelect(consumerName: string) {
  const context = React.useContext(MultiSelectContext);
  if (context === undefined) {
    throw new Error(`${consumerName} must be used within a MultiSelectProvider`);
  }
  return context;
}

interface MultiSelectProps 
  extends Omit<
    React.ComponentPropsWithoutRef<typeof Popover>,
    | 'open' 
    | 'onOpenChange'
    | 'defaultOpen'
>{
  value?: MultiSelectValueType[];
  onValueChange?: (value: MultiSelectValueType[]) => void;
  defaultValue?: MultiSelectValueType[];
  open?: boolean;
  onOpenChange?: (value: boolean) => void;
  defaultOpen?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = (({ value, onValueChange, defaultValue, open, onOpenChange, defaultOpen, ...props }) => {

  return (
    <MultiSelectProvider 
      value={value} 
      onValueChange={onValueChange} 
      defaultValue={defaultValue} 
      open={open} 
      onOpenChange={onOpenChange} 
      defaultOpen={defaultOpen}
    >
      <MultiSelectPopoverWrapper {...props} />
    </MultiSelectProvider>
  )
});
MultiSelect.displayName = "MultiSelect";


interface MultiSelectPopoverWrapperProps extends React.ComponentPropsWithoutRef<typeof Popover> {}

// TODO (jeffjuann): this accept open and onOpenChange props, but it is not used in the component
const MultiSelectPopoverWrapper: React.FC<MultiSelectPopoverWrapperProps> = ({ open, onOpenChange, defaultOpen, ...props }) => {
  
  const {
    open: isOpen,
    setOpen: onIsOpenChange,
  } = useMultiSelect('MultiSelect')
  
  return (
    <Popover
      open={isOpen}
      onOpenChange={onIsOpenChange}
      {...props}
    >
      {props.children}
    </Popover>
  )
}

interface MultiSelectTriggerProps extends React.ComponentPropsWithoutRef<typeof PopoverTrigger>
{
  hideIcon?: boolean;
}

const MultiSelectTrigger = React.forwardRef<
  HTMLButtonElement,
  MultiSelectTriggerProps
>(({ children, className, hideIcon = false, ...props }, ref) => {
  
  const setOpen = useMultiSelect('MultiSelectTrigger').setOpen;

  return (
    <PopoverTrigger 
      ref={ref}
      onKeyDown={(e) => 
      {
        if(OPEN_KEYS.includes(e.key)) 
        {
          setOpen(true);
          e.preventDefault();
        }
      }}
      className={cn(
        "flex h-9 w-full justify-start whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm scrollbar-none shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 data-[placeholder]:text-muted-foreground",
        className
      )} 
      {...props}
    >
      {children}
      {
        hideIcon !== true && (
          <CaretSortIcon className={cn("h-4 w-4 opacity-50")} />
        )
      }
    </PopoverTrigger>
  )
});
MultiSelectTrigger.displayName = "MultiSelectTrigger";

interface MultiSelectValueProps extends React.ComponentPropsWithoutRef<"div"> 
{
  placeholder?: string;
  itemComponent?: React.FC<MultiSelectValueItemProps>;
}

const MultiSelectValue = React.forwardRef<
  HTMLDivElement,
  MultiSelectValueProps
>(({ className, placeholder, itemComponent: ItemComponent = MultiSelectValueItem, ...props }, _) => {
  const { selected: values } = useMultiSelect('MultiSelectValue');

  return (
    <div 
      className={cn(
        "relative w-full flex flex-row overflow-hidden h-fit justify-start gap-1 hover:bg-background",
        className
      )}
      {...props}
    >
      {
        values.length === 0 ? (
          <span className="text-sm text-muted-foreground font-normal">
            {placeholder}
          </span>
        ) : (
          values.map((value) => (
            <ItemComponent key={value} value={value}>
              {value}
            </ItemComponent>
          ))
        )
      }
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-r from-transparent to-background"></div>
    </div>
  )
});
MultiSelectValue.displayName = "MultiSelectValue";

interface MultiSelectValueItemProps extends React.ComponentPropsWithoutRef<typeof Badge>
{
  value: string;
}

const MultiSelectValueItem: React.FC<MultiSelectValueItemProps> = (({ value, className, children, ...props }) => (
  <Badge
    className={cn(
      "rounded-sm px-1 font-normal hover:bg-primary",
      className
    )}
    {...props}
  >
    {children || value}
  </Badge>
));
MultiSelectValueItem.displayName = "MultiSelectValueItem";

const MultiSelectContent = React.forwardRef<
  React.ElementRef<typeof PopoverContent>,
  React.ComponentPropsWithoutRef<typeof PopoverContent>
>(({ className, ...props }, ref) => {

  const commandRef = React.useRef<HTMLDivElement>(null);

  return (
    <PopoverContent 
      ref={ref}
      className={cn(
        "w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0",
        className
      )}
      align="start"
      onOpenAutoFocus={() => commandRef.current?.focus()}
      {...props}
    >
      <Command ref={commandRef} className="focus:outline-none">
        <CommandList
          className="max-h-full">
          {props.children}
        </CommandList>
      </Command>
    </PopoverContent>
  )
});
MultiSelectContent.displayName = "MultiSelectContent";

const MultiSelectEmpty = React.forwardRef<
  React.ElementRef<typeof CommandEmpty>,
  React.ComponentPropsWithoutRef<typeof CommandEmpty>
>(({ className, ...props }, ref) => (
  <CommandEmpty 
    ref={ref}
    className={cn(
      "flex items-center justify-center text-muted-foreground p-2",
      className
    )}
    {...props}
  />
));
MultiSelectEmpty.displayName = "MultiSelectEmpty";

// TODO (jeffjuann): This just forwards the props to CommandGroup, so forwardRef is not fully necessary
// except for consistency and display name.
const MultiSelectGroup = React.forwardRef<
  React.ElementRef<typeof CommandGroup>,
  React.ComponentPropsWithoutRef<typeof CommandGroup>
>(({ className, ...props }, ref) => (
  <CommandGroup 
    ref={ref}
    className={cn(
      className
    )}
    {...props}
  />
));
MultiSelectGroup.displayName = "MultiSelectGroup";

interface MultiSelectItemProps extends React.ComponentPropsWithoutRef<typeof CommandItem> {
  value: string;
}

const MultiSelectItem = React.forwardRef<
  HTMLDivElement,
  MultiSelectItemProps
>(({ className, value, ...props }, ref) => {
  const {
    selected: values,
    setSelected: setValues
  } = useMultiSelect('MultiSelectItem');

  const isSelected = React.useMemo(() => {
    return values.find((v) => v === value)
  }, [values]);

  const handleSelect = () => {
    console.log(setValues)
    if (!setValues) return;

    if(isSelected) {
      setValues(values.filter((v) => v !== value));
    } else {
      setValues([...values, value]);
    }
  }

  return (
    <CommandItem 
      ref={ref}
      className={cn(
        "flex items-center rounded-sm",
        className
      )}
      onSelect={handleSelect}
      {...props}
    >
      <div
        className={cn(
          "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "opacity-50 [&_svg]:invisible",
        )}
      >
        <Check className="size-4" aria-hidden="true" />
      </div>
      <span>{props.children}</span>
    </CommandItem>
  )
});
MultiSelectItem.displayName = "MultiSelectItem";

export {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectValueItem,
  MultiSelectContent,
  MultiSelectEmpty,
  MultiSelectGroup,
  MultiSelectItem
}