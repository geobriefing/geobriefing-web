import Link from 'next/link'

const Logo = ({ size = 'lg' }: { size?: 'sm' | 'lg' }) => {
  const isLarge = size === 'lg'

  return (
    <Link href="/" className="inline-block">
      <svg
        width={isLarge ? 440 : 220}
        height={isLarge ? 64 : 32}
        viewBox="0 0 440 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="0"
          y="44"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="48"
          fontWeight="700"
          fill="#1a1a1a"
          letterSpacing="-1"
        >
          Geo
        </text>

        <polyline
          points="128,46 136,28 144,36 152,14 160,26 168,8"
          stroke="#1a1a1a"
          strokeWidth="2.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="128" cy="46" r="3" fill="#1a1a1a" />
        <circle cx="136" cy="28" r="3" fill="#1a1a1a" />
        <circle cx="144" cy="36" r="3" fill="#1a1a1a" />
        <circle cx="152" cy="14" r="3" fill="#1a1a1a" />
        <circle cx="160" cy="26" r="3" fill="#1a1a1a" />
        <circle cx="168" cy="8" r="5.5" fill="#1a6b3c" />

        <text
          x="178"
          y="44"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="48"
          fontWeight="700"
          fill="#1a1a1a"
          letterSpacing="-1"
        >
          riefing
        </text>

        <line x1="0" y1="53" x2="440" y2="53" stroke="#1a1a1a" strokeWidth="1" />
        <text
          x="0"
          y="63"
          fontFamily="'Helvetica Neue', Arial, sans-serif"
          fontSize="7"
          fill="#999"
          letterSpacing="5"
        >
          SPATIAL INTELLIGENCE · GLOBAL EDITION
        </text>
      </svg>
    </Link>
  )
}

export default Logo