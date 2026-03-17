// src/components/ui/dialog.tsx
import { ReactNode, forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { DialogPrimitive, Overlay, Portal, Content, Title, Description, Close } from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { styled } from '@/lib/theme';

const Overlay = styled(Overlay)`
  fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0;
`;

const ContentWrapper = styled(Portal)`
  relative z-50 grid w-full gap-4 bg-background p-6 shadow-lg transition-all duration-200 sm:rounded-lg max-h-[90vh];
  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0;
`;

const Header = styled.div`
  flex flex-col space-y-1.5 text-center sm:text-left;
`;

const Footer = styled.div`
  flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2;
`;

const TitleComponent = styled(Title)`
  text-lg font-semibold leading-none tracking-tight;
`;

const DescriptionComponent = styled(Description)`
  text-sm text-muted-foreground;
`;

const CloseButton = styled(Close)`
  absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none;
  data-[state=open]:bg-accent data-[state=closed]:bg-muted;
`;

const Dialog = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) => (
  <DialogPrimitive.Root {...props}>
    <DialogTrigger>
      {children}
    </DialogTrigger>
    <DialogPrimitive.Portal>
      <Overlay className={className} />
      <ContentWrapper>
        <Header />
        <TitleComponent />
        <DescriptionComponent />
        <Footer />
        <CloseButton>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </CloseButton>
      </ContentWrapper>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);

export {
  Dialog,
  ContentWrapper,
  TitleComponent,
  DescriptionComponent,
  Header,
  Footer,
  CloseButton,
  Overlay,
};
```

**