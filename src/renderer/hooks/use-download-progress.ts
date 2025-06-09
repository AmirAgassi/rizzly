import { useEffect } from 'react';
import { useChatStore } from '../stores';

export const useDownloadProgress = () => {
  const { setDownloadingPhotos, addPhotoToLatestStack } = useChatStore();

  useEffect(() => {
    const removeProgressListener = window.electronAPI.onDownloadProgress((data) => {
      console.log('renderer: download progress:', { 
        imageCount: data.imageCount, 
        hasImage: !!data.imageBase64,
        isComplete: data.isComplete 
      });
      
      if (data.isComplete) {
        console.log('renderer: download complete');
        setDownloadingPhotos(false);
      } else if (data.imageBase64) {
        console.log('renderer: adding new image to latest stack');
        addPhotoToLatestStack(data.imageBase64);
      }
    });

    return () => {
      removeProgressListener();
    };
  }, [setDownloadingPhotos, addPhotoToLatestStack]);
}; 