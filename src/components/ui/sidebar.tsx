"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeftIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [openState, setOpenState] = React.useState(defaultOpen)
  const [openMobile, setOpenMobile] = React.useState(false)

  const open = openProp ?? openState
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        setOpenState(openState)
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  const toggleSidebar = React.useCallback(() => {
    return setOpen((open) => !open)
  }, [setOpen])

  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContext>(
    () => ({
      state,
      open,
      setOpen,
      isMobile: false,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        className={cn(
          "group/sidebar-wrapper flex min-h-screen w-full font-sans text-sidebar-foreground",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  className,
  children,
  ...props
}: React.ComponentProps<"aside">) {
  const { state } = useSidebar()

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen flex flex-col border-r border-neutral-800 bg-[#050505] text-white shrink-0 font-sans transition-all duration-200 z-20",
        state === "collapsed" ? "w-16" : "w-64",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("size-8 text-neutral-400 hover:text-white", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeftIcon className="size-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto font-sans p-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col font-sans", className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const { state } = useSidebar()
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      data-sidebar="group-label"
      className={cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-sans",
        state === "collapsed" && "sr-only",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="group-content"
      className={cn("w-full text-xs font-sans", className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1 font-sans", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-sidebar="menu-item"
      className={cn("group/menu-item relative font-sans", className)}
      {...props}
    />
  )
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2.5 overflow-hidden rounded-md p-2 text-left text-xs font-medium outline-none transition-colors hover:bg-neutral-800 hover:text-white data-[active=true]:bg-white data-[active=true]:text-black data-[active=true]:font-semibold font-sans",
  {
    variants: {
      variant: {
        default: "hover:bg-neutral-800 hover:text-white",
        outline: "bg-background shadow-xs hover:bg-neutral-800 hover:text-white",
      },
      size: {
        default: "h-9 text-xs px-3",
        sm: "h-8 text-xs px-2.5",
        lg: "h-11 text-sm px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  isActive?: boolean
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-sidebar="menu-button"
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
}
