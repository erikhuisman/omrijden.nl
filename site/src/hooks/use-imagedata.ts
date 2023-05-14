
import { useEffect, useState } from 'react';

export default function useImageData(src: HTMLImageElement['src']) {
    const [imageData, setImageData] = useState<ImageData>()

    useEffect(() => {
        const imageEl = new Image();
        imageEl.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = imageEl.width;
            canvas.height = imageEl.height;

            var context = canvas.getContext('2d');
            context!.drawImage(imageEl, 0, 0);
            var imageData = context!.getImageData(0, 0, canvas.width, canvas.height);
            setImageData(imageData)
        };
        imageEl.src = src
    }, [src])

    return imageData;
}
