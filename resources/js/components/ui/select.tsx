import * as React from "react"

import * as SelectPrimitive from "@radix-ui/react-select"
import {
  CaretSortIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons"

import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";


export interface SelectContextType 
{
  clearable?: boolean;
  onValueChange?: (value: string) => void;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);
SelectContext.displayName = "SelectProvider";

interface SelectProviderProps extends React.PropsWithChildren {
  clearable?: boolean;
  onValueChange?: (value: string) => void;
}

const SelectProvider = ({ clearable, onValueChange, ...props }: SelectProviderProps) => {
  const providerValue = React.useMemo(() => ({
    clearable,
    onValueChange,
  }), [clearable, onValueChange]);
  return <SelectContext.Provider value={providerValue} {...props} />;
};

export function useSelect(consumerName: string) {
  const context = React.useContext(SelectContext);
  if (context === undefined) {
    throw new Error(`${consumerName} must be used within a SelectProvider`);
  }
  return context;
}

interface SelectProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> 
{
  // clearable must be used with controlled value and controlled onValueChange
  clearable?: boolean
}

const Select = ({ clearable, value, ...props }: SelectProps) => 
{
  return (
    <SelectProvider clearable={clearable && !!value} onValueChange={props.onValueChange}>
      <SelectPrimitive.Root
        value={value}
        {...props}
      />
    </SelectProvider>
  )
}

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
{
  wrapperClassName?: string
  iconClassName?: string
  hideIcon?: boolean
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
  >(({ 
  hideIcon,
  className, 
  wrapperClassName,
  iconClassName,
  children, 
  ...props 
}, ref) => {
  const { clearable, onValueChange } = useSelect("SelectTrigger")

  const classNameHeight = React.useMemo(() =>
  {
    // match h-* classes from tailwind by regex not always number
    const match = className?.match(/h-[^\s]+/gm);
    if (match) {
      return match[match.length - 1];
    }
    
    return "h-9"; // default height

  }, [className]);
  
  return (
    <div className={cn("relative group w-full h-9", wrapperClassName, classNameHeight)}>
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 data-[placeholder]:text-muted-foreground",
          className
        )}
        {...props}
      >
        {children}
        {
          hideIcon !== true && (
            <SelectPrimitive.Icon asChild>
              <CaretSortIcon
                className={cn("absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50", clearable && "group-hover:hidden", iconClassName)} />
            </SelectPrimitive.Icon>
          )
        }
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Icon asChild>
        {
          clearable && (
            <XIcon 
              className={cn("absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground hidden group-hover:block", iconClassName)}
              onClick={() => onValueChange?.("")}
            />
          )
        }
      </SelectPrimitive.Icon>
    </div>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUpIcon />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDownIcon />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
