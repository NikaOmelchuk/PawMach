export default function HeartPawsLogo({ width = 110, height = 110, style = {} }) {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: 'drop-shadow(0 4px 10px rgba(147,112,219,0.3))', ...style }}
        >
            <path
                d="M50 85 C50 85 15 60 15 35 C15 18 35 15 50 32 C65 15 85 18 85 35 C85 45 78 55 68 64"
                fill="var(--accent, #9370DB)"
                fillOpacity="0.4"
                stroke="var(--accent, #9370DB)"
                strokeWidth="4"
                strokeLinecap="round"
            />
            <g fill="var(--accent-hover, #7a52cc)">
                <circle cx="52" cy="75" r="3.5" />
                <circle cx="58" cy="65" r="3.5" />
                <circle cx="68" cy="65" r="3.5" />
                <circle cx="74" cy="75" r="3.5" />
                <path d="M63 90 C55 90 52 83 56 78 C60 73 66 73 70 78 C74 83 71 90 63 90 Z" />
            </g>
            <g fill="var(--accent-hover, #7a52cc)">
                <circle cx="68" cy="50" r="3.5" />
                <circle cx="74" cy="40" r="3.5" />
                <circle cx="84" cy="40" r="3.5" />
                <circle cx="90" cy="50" r="3.5" />
                <path d="M79 65 C71 65 68 58 72 53 C76 48 82 48 86 53 C90 58 87 65 79 65 Z" />
            </g>
        </svg>
    );
}
