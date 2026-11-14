import type { ComponentProps } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = Omit<ComponentProps<typeof Button>, "render" | "nativeButton"> & {
  href: string;
};

/**
 * Enlace con aspecto de botón. Base UI espera un <button> nativo salvo que se
 * indique nativeButton={false}; este componente lo hace siempre.
 */
export function BotonEnlace({ href, children, ...props }: Props) {
  return (
    <Button nativeButton={false} render={<Link href={href} />} {...props}>
      {children}
    </Button>
  );
}
