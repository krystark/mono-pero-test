import React from "react";
import { twMerge } from "tailwind-merge";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function AuthPrimaryButton({ className, disabled, ...rest }: Props) {
    return (
        <button
            type="button"
            disabled={disabled}
            className={twMerge(
                [
                    "w-full h-[56px] rounded-[14px]",
                    "text-white font-semibold text-[18px] leading-[22px]",
                    "select-none",
                    "bg-gradient-to-b from-[#367AFF] to-[#242EDB]",
                    "shadow-[0_14px_30px_rgba(36,46,219,0.35)]",
                    "active:translate-y-[1px] active:shadow-[0_10px_22px_rgba(36,46,219,0.30)]",
                    "relative overflow-hidden",
                    "before:content-[''] before:absolute before:inset-0",
                    "before:bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_45%)]",
                    "before:pointer-events-none",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0",
                    "hover:brightness-[1.02]",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(54,122,255,0.22)]",
                ].join(" "),
                className,
            )}
            {...rest}
        />
    );
}
