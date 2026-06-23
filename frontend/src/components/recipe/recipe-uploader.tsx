"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, ChefHat, ImagePlus, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecipeUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isGenerating: boolean;
}

const MAX_IMAGES = 5;

export function RecipeUploader({ onFilesSelected, isGenerating }: RecipeUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const combined = [...files, ...newFiles].slice(0, MAX_IMAGES);
      setFiles(combined);
      setPreviews(combined.map((f) => URL.createObjectURL(f)));
    },
    [files]
  );

  const onDrop = useCallback(
    (accepted: File[]) => addFiles(accepted),
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: MAX_IMAGES,
    maxSize: 10 * 1024 * 1024,
    disabled: isGenerating || files.length >= MAX_IMAGES,
  });

  function handleCameraClick() {
    cameraInputRef.current?.click();
  }

  function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      addFiles([file]);
    }
    e.target.value = "";
  }

  function removeFile(idx: number) {
    const newFiles = files.filter((_, i) => i !== idx);
    setFiles(newFiles);
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)));
  }

  function handleGenerate() {
    if (files.length === 0) return;
    onFilesSelected(files);
  }

  function clearAll() {
    setFiles([]);
    setPreviews([]);
  }

  return (
    <Card className="p-6">
      {/* Hidden camera input (outside dropzone) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
        disabled={isGenerating || files.length >= MAX_IMAGES}
      />

      <div className="space-y-4">
        {/* Dropzone */}
        {files.length < MAX_IMAGES && (
          <>
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                isDragActive
                  ? "border-orange-500 bg-orange-50"
                  : "border-border hover:border-orange-300 hover:bg-muted/30",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-full">
                  <Upload className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold">
                    {isDragActive
                      ? "Drop images here"
                      : files.length === 0
                      ? "Upload ingredient images"
                      : "Add more ingredients"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Drag & drop or click • {files.length}/{MAX_IMAGES} images
                  </p>
                </div>
              </div>
            </div>

            {/* OR divider — OUTSIDE dropzone */}
            <div className="flex items-center gap-3 w-full max-w-xs mx-auto">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-xs text-muted-foreground font-medium">OR</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* Camera button — OUTSIDE dropzone */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleCameraClick}
                disabled={isGenerating || files.length >= MAX_IMAGES}
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                Take a Photo
              </Button>
            </div>
          </>
        )}

        {/* Previews */}
        {previews.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">
                {files.length} {files.length === 1 ? "image" : "images"} selected
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={isGenerating}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" /> Clear all
              </Button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {previews.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border group">
                  <img src={url} alt={`Ingredient ${idx + 1}`} className="w-full h-full object-cover" />
                  {!isGenerating && (
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {files.length < MAX_IMAGES && (
                <div className="flex flex-col gap-1">
                  <button
                    {...getRootProps()}
                    className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center hover:border-orange-300 hover:bg-orange-50 transition-all flex-1"
                  >
                    <input {...getInputProps()} />
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCameraClick}
                    disabled={isGenerating}
                    className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center hover:border-orange-300 hover:bg-orange-50 transition-all flex-1"
                  >
                    <Camera className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || files.length === 0}
              className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
              size="lg"
            >
              <ChefHat className="h-5 w-5 mr-2" />
              Generate Recipes
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}