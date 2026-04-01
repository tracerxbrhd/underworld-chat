type UserGlyphProps = {
  className?: string;
};

export function UserGlyph({ className }: UserGlyphProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 12.25a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm0 2c-4.55 0-8.25 2.56-8.25 5.72 0 .7.57 1.28 1.28 1.28h13.94c.7 0 1.28-.57 1.28-1.28 0-3.16-3.7-5.72-8.25-5.72Z"
        fill="currentColor"
      />
    </svg>
  );
}

