import { Toaster as Sonner } from "sonner"

import { cn } from "@/lib/utils"
import { useToastManager } from "@/hooks/use-toast"

const MAX_TOASTS = 3;

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) =>
{
  useToastManager(MAX_TOASTS);

  return (
    <Sonner
    position="top-right"
    closeButton
    visibleToasts={MAX_TOASTS}
    toastOptions={{
      unstyled: true,
      classNames: {
          toast: cn(
            "group cursor-pointer max-h-screen w-full md:max-w-[420px] border shadow-lg rounded-md p-2 pr-7 flex flex-row items-center gap-1",

            // Toast Variants:
            // Default:
            "bg-background text-foreground border-border",
            // Constructive:
            "data-[type=success]:bg-constructive data-[type=success]:text-constructive-foreground data-[type=success]:border-constructive",
            // Warning:
            "data-[type=warning]:bg-warning data-[type=warning]:text-warning-foreground data-[type=warning]:border-warning",
            // Destructive:
            "data-[type=error]:bg-destructive data-[type=error]:text-destructive-foreground data-[type=error]:border-destructive",
            // Loading:
            "data-[type=loading]:select-none",
          ),
          title: cn(
            "text-sm font-semibold [&+div]:text-xs"
          ),
          description: "group-[.toast]:text-muted-foreground",
          actionButton: cn(
            "ml-auto inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 ",

            // Toast Action Button Variants:
            // Default:
            "hidden",
            // Destructive:
            "group-data-[type=error]:block group-data-[type=error]:border-destructive group-data-[type=error]:bg-destructive-foreground group-data-[type=error]:text-destructive group-data-[type=error]:hover:bg-destructive-foreground/90 group-data-[type=error]:hover:text-destructive group-data-[type=error]:focus:ring-destructive",
          ),
          icon: cn(
            "size-5 relative",
          ),
          closeButton:
            "absolute left-auto right-1.5 top-1.5 opacity-50 hover:opacity-100 transition-all",
          cancelButton: cn(
            "ml-auto inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 ",

            // Toast Action Button Variants:
            // Default:
            "hidden",
            // Destructive:
            "group-data-[type=error]:block group-data-[type=error]:border-destructive-foreground/50 group-data-[type=error]:bg-destructive-foreground/10 group-data-[type=error]:text-destructive-foreground group-data-[type=error]:hover:bg-destructive-foreground/15 group-data-[type=error]:hover:text-destructive-foreground group-data-[type=error]:focus:ring-destructive",
          ),
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
