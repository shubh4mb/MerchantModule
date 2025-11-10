declare module "../utils/croping/cropImage" {
  export type PixelCrop = {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /**
   * Returns a JPEG Blob cropped from the source image by the given pixel rectangle.
   */
  export default function getCroppedImg(
    imageSrc: string,
    pixelCrop: PixelCrop
  ): Promise<Blob>;
}
