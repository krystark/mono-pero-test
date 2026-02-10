// components/ScrollToTopOnRouteChange.tsx
import React from "react";
import { useScrollToTopOnRouteChange } from "../hooks/useScrollToTopOnRouteChange";

type Props = {
    behavior?: ScrollBehavior;
    containerSelector?: string;
    disabled?: boolean;
    children?: React.ReactNode;
};

export const ScrollToTopOnRouteChange: React.FC<Props> = (props) => {
    useScrollToTopOnRouteChange(props);
    return <>{props.children}</>;
};
