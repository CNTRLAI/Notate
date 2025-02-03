import Image from "next/image";
export const SvgIcon = ({ src, alt }: { src: string; alt: string }) => (
  <div className="h-3 w-3 relative">
    <Image
      src={src}
      alt={alt}
      className="w-full h-full object-contain [filter:brightness(0)_invert(1)]"
    />
  </div>
);
