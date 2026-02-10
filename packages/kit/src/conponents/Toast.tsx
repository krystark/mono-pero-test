// src/components/Toast/Toast.tsx
import React from "react";

export interface ToastProps {
    variant?: "default" | "error";
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
}

function cx(...c: Array<string | false | null | undefined>) {
    return c.filter(Boolean).join(" ");
}

export const Toast: React.FC<ToastProps> = ({
                                                variant = "default",
                                                children,
                                                onClose,
                                                className,
                                            }) => {
    return (
        <div
            className={cx(
                "relative rounded text-text-onColor text-body-m",
                "py-[10px] pl-[16px] pr-[52px]",
                variant === "default" && "bg-background-primaryInverse",
                variant === "error" && "bg-background-negative",
                className
            )}
        >
            {children}

            {/* крестик */}
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-[4px] right-[4px]"
                >
                    <svg
                        viewBox="0 0 32 32"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-[32px] h-[32px]"
                    >
                        <path
                            d="M20.4697 10.4697C20.7626 10.1768 21.2373 10.1768 21.5302 10.4697C21.8231 10.7626 21.8231 11.2373 21.5302 11.5302L17.0605 15.9999L21.5302 20.4697C21.8231 20.7626 21.8231 21.2373 21.5302 21.5302C21.2373 21.8231 20.7626 21.8231 20.4697 21.5302L15.9999 17.0605L11.5302 21.5302C11.2373 21.8231 10.7626 21.8231 10.4697 21.5302C10.1768 21.2373 10.1768 20.7626 10.4697 20.4697L14.9394 15.9999L10.4697 11.5302C10.1768 11.2373 10.1768 10.7626 10.4697 10.4697C10.7626 10.1768 11.2373 10.1768 11.5302 10.4697L15.9999 14.9394L20.4697 10.4697Z"
                            fill="rgb(var(--white-main))"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
};
