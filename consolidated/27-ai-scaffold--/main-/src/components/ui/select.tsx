// src/components/ui/select.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Select as SelectPrimitive,
  SelectTrigger,
  SelectContent,
  SelectPortal,
  SelectViewport,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectSeparator,
  SelectLabel,
  SelectValue,
  SelectGroup,
  SelectIcon,
} from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

// Component Groupings
interface SelectGrouping {
  Select: React.ForwardedRef<
    React.ElementRef<typeof SelectPrimitive>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive>
  >;
  SelectTrigger: React.ForwardedRef<
    React.ElementRef<typeof SelectPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
  >;
  SelectContent: React.ForwardedRef<
    React.ElementRef<typeof SelectPrimitive.Content>,
    React.ComponentPropsWithoutRef(typeof SelectPrimitive.Content)
  >;
  SelectLabel: React.ForwardedRef<
    React.ElementRef<typeof SelectPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
  >;
  SelectItem: React.ForwardedRef<
    React.ElementRef<typeof SelectPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
  >;
  SelectSeparator: React.ForwardedRef<
    React.ElementRef<typeof SelectPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
  >;
  SelectScrollUpButton: React.ForwardedRef<
    React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
  >;
  SelectScrollDownButton: React.ForwardedRef<
    React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
  >;
}

const groupings: SelectGrouping = {
  Select: (props, ref) => (
    <SelectPrimitive.Root {...props} ref={ref}>
      {props.children}
    </SelectPrimitive.Root>
  ),
  SelectTrigger: (props, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex h-10 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        props.className
      )}
      {...props}
    >
      {props.children}
      <SelectIcon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectIcon>
    </SelectPrimitive.Trigger>
  ),
  SelectContent: (props, ref) => (
    <SelectPortal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          props.position === 'popper' &&
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          props.className
        )}
        position={props.position}
        {...props}
      >
        <SelectViewport
          className="p-1"
          pointerEvents={props.position === 'popper' ? 'none' : 'auto'}
        >
          {props.children}
        </SelectViewport>
      </SelectPrimitive.Content>
    </SelectPortal>
  ),
  SelectLabel: (props, ref) => (
    <SelectPrimitive.Label
      ref={ref}
      className={cn('py-1.5 pl-8 pr-2 text-sm font-medium', props.className)}
      {...props}
    />
  ),
  SelectItem: (props, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled=true]:opacity-50',
        props.className
      )}
      {...props}
    >
      <SelectItemIndicator>
        <Check className="h-4 w-4" />
      </SelectItemIndicator>
      <SelectItemText>{props.children}</SelectItemText>
    </SelectPrimitive.Item>
  ),
  SelectSeparator: (props, ref) => (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-muted', props.className)}
      {...props}
    />
  ),
  SelectScrollUpButton: (props, ref) => (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn(
        'flex h-9.5 w-9.5 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.className
      )}
      {...props}
    >
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  ),
  SelectScrollDownButton: (props, ref) => (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn(
        'flex h-9.5 w-9.5 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.className
      )}
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  ),
};

Object.values(groupings).forEach((Component) => {
  Component.displayName = SelectPrimitive[Component.name].displayName;
});

export { ...groupings };