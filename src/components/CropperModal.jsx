import React, { useEffect, useRef, useState } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { RotateCcw, RotateCw } from 'lucide-react';

export default function CropperModal({ isOpen, onClose, imageSrc, onCropComplete }) {
  const imageRef = useRef(null);
  const cropperRef = useRef(null);

  useEffect(() => {
    if (isOpen && imageSrc && imageRef.current) {
      if (cropperRef.current) {
        cropperRef.current.destroy();
      }
      cropperRef.current = new Cropper(imageRef.current, {
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 1,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
      });
    }

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [isOpen, imageSrc]);

  const handleRotateLeft = () => cropperRef.current?.rotate(-90);
  const handleRotateRight = () => cropperRef.current?.rotate(90);

  const handleApplyCrop = () => {
    if (!cropperRef.current) return;

    // Get cropped canvas
    const canvas = cropperRef.current.getCroppedCanvas({
      maxWidth: 1920,
      maxHeight: 1080,
      fillColor: '#fff',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });

    if (canvas) {
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      onCropComplete(croppedDataUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[10000] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 w-full max-w-3xl flex flex-col max-h-[90vh]">

        <div className="flex justify-between items-center mb-4 border-b pb-3">
           <h3 className="text-xl font-bold text-slate-800">Crop & Rotate Image</h3>
        </div>

        <div className="flex-1 min-h-0 bg-slate-100 rounded-xl overflow-hidden relative">
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Source to crop"
            className="block max-w-full"
            style={{ maxHeight: '60vh' }}
          />
        </div>

        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-2">
            <button onClick={handleRotateLeft} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button onClick={handleRotateRight} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition">
              <RotateCw className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={onClose} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex-1 sm:flex-none">
              Cancel
            </button>
            <button onClick={handleApplyCrop} className="btn-primary px-6 py-2 font-bold rounded-xl flex-1 sm:flex-none">
              Apply Crop
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
