"use client"

import { cn } from "@/lib/utils"

interface SyncSpinnerProps {
    className?: string;
    size?: number | string;
}

export function SyncSpinner({ className, size = 92 }: SyncSpinnerProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 92 87"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("select-none", className)}
        >
            {/* User Silhouette - Replacing the "Mail" part */}
            {/* Torso */}
            <path
                d="M30 59.37C30 50 36 44 46 44C56 44 62 50 62 59.37H30Z"
                fill="#CDCDD8"
            />
            {/* Torso Shadow/Detail */}
            <path
                d="M32 59.37C32 52 37 47 46 47C55 47 60 52 60 59.37H32Z"
                fill="#E5E5F0"
            />
            {/* Head */}
            <circle
                cx="46"
                cy="34"
                r="8"
                fill="#8C92A5"
            />
            <circle
                cx="46"
                cy="34"
                r="6"
                fill="#CDCDD8"
            />

            {/* Rotating Elements from original SVG */}
            <path
                className="emptyInboxRotation"
                d="M77.8202 29.21L89.5402 25.21C89.9645 25.0678 90.4327 25.1942 90.7277 25.5307C91.0227 25.8673 91.0868 26.348 90.8902 26.75L87.0002 34.62C86.8709 34.8874 86.6407 35.0924 86.3602 35.19C86.0798 35.2806 85.7751 35.2591 85.5102 35.13L77.6502 31.26C77.2436 31.0643 76.9978 30.6401 77.0302 30.19C77.0677 29.7323 77.3808 29.3438 77.8202 29.21Z"
                fill="#E5E5F0"
            />
            <path
                className="emptyInboxRotation"
                d="M5.12012 40.75C6.36707 20.9791 21.5719 4.92744 41.2463 2.61179C60.9207 0.296147 79.4368 12.3789 85.2401 31.32"
                stroke="#E5E5F0"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                className="emptyInboxRotation"
                d="M14.18 57.79L2.46001 61.79C2.03313 61.9358 1.56046 61.8088 1.2642 61.4686C0.967927 61.1284 0.906981 60.6428 1.11001 60.24L5.00001 52.38C5.12933 52.1127 5.35954 51.9076 5.64001 51.81C5.92044 51.7194 6.22508 51.7409 6.49001 51.87L14.35 55.74C14.7224 55.9522 14.9394 56.36 14.9073 56.7874C14.8753 57.2149 14.5999 57.5857 14.2 57.74L14.18 57.79Z"
                fill="#E5E5F0"
            />
            <path
                className="emptyInboxRotation"
                d="M86.9998 45.8C85.9593 65.5282 70.9982 81.709 51.4118 84.2894C31.8254 86.8697 13.1841 75.1156 7.06982 56.33"
                stroke="#E5E5F0"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
