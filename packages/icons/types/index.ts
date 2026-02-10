import React from "react";

export type IconSize = "xs" | "sm" | "md" | "lg";

export type IconProps = React.SVGProps<SVGSVGElement> & {
    size?: IconSize;
    w?: number;
    h?: number;
};
