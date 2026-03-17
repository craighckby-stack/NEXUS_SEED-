"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

interface CollapsibleProps extends React.ComponentProps<typeof CollapsiblePrimitive.Root> {}

const Collapsible = ({ ...props }: CollapsibleProps) => (
  <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
)

interface CollapsibleTriggerProps extends React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger> {}

const CollapsibleTrigger = ({ ...props }: CollapsibleTriggerProps) => (
  <CollapsiblePrimitive.CollapsibleTrigger data-slot="collapsible-trigger" {...props} />
)

interface CollapsibleContentProps extends React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent> {}

const CollapsibleContent = ({ ...props }: CollapsibleContentProps) => (
  <CollapsiblePrimitive.CollapsibleContent data-slot="collapsible-content" {...props} />
)

export { Collapsible, CollapsibleTrigger, CollapsibleContent }