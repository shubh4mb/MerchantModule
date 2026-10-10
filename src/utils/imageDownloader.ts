/**
 * Utility to download single or multiple images directly to the user's computer/device.
 */
export async function downloadImageFile(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    // Fallback: direct anchor link download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export async function downloadMultipleImages(
  images: Array<string | { url?: string }>,
  baseName: string = 'product-photo',
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const urls = images
    .map((img) => (typeof img === 'string' ? img : img?.url))
    .filter((u): u is string => Boolean(u));

  if (urls.length === 0) {
    alert('No images available to download.');
    return;
  }

  for (let i = 0; i < urls.length; i++) {
    onProgress?.(i + 1, urls.length);
    const ext = urls[i].split('.').pop()?.split('?')[0] || 'jpg';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext.toLowerCase()) ? ext : 'jpg';
    const filename = `${baseName}-${i + 1}.${cleanExt}`;
    await downloadImageFile(urls[i], filename);
    // Short pause so browser doesn't block multi-downloads
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}
