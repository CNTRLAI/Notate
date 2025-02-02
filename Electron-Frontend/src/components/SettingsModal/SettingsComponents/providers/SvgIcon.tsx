export const SvgIcon = ({ src, alt }: { src: string; alt: string }) => (
  <div className="h-3 w-3 relative">
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-contain [filter:brightness(0)_invert(1)]"
    />
  </div>
);
