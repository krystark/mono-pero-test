import * as React from "react";
import type { IconSize, IconProps } from "../types";

const SIZE_MAP: Record<IconSize, number> = {
    xs: 16,
    sm: 20,
    md: 32,
    lg: 44,
};

export type IconWrapProps = IconProps & {
    viewBox?: string;
};

export const IconWrap = React.forwardRef<SVGSVGElement, IconWrapProps>(
    ({ size = "sm", w, h, viewBox = "0 0 20 20", children, ...rest }, ref) => {
        const width = w ?? SIZE_MAP[size];
        const height = h ?? SIZE_MAP[size];

        const hasLabel = Boolean(rest["aria-label"]) || Boolean((rest as any).title);

        return (
            <svg
                ref={ref}
                viewBox={viewBox}
                width={width}
                height={height}
                xmlns="http://www.w3.org/2000/svg"
                role={hasLabel ? "img" : undefined}
                aria-hidden={hasLabel ? undefined : true}
                focusable="false"
                {...rest}
            >
                {children}
            </svg>
        );
    },
);

export default IconWrap;
