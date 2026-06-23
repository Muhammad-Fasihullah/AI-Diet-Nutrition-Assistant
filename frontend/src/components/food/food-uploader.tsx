"use client";

import { useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Upload, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FoodUploaderProps {
  onFileSelect: (file: File) => void;
  previewUrl: string | null;
  isAnalyzing: boolean;
}

export function FoodUploader({ onFileSelect, previewUrl, isAnalyzing }: FoodUploaderProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isAnalyzing,
  });

  function handleCameraClick() {
    cameraInputRef.current?.click();
  }

  function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    e.target.value = "";
  }

  if (previewUrl) {
    return (
      <Card className="overflow-hidden">
        <div className="relative">
          <img
            src={previewUrl}
            alt="Food preview"
            className="w-full h-64 object-cover"
          />
          {!isAnalyzing && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { window.location.reload(); }}
              className="absolute top-3 right-3"
            >
              <X className="h-4 w-4 mr-1" /> Upload another
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Hidden camera input (outside the dropzone!) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
        disabled={isAnalyzing}
      />

      {/* Dropzone — only for upload */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-brand-500 bg-brand-50"
            : "border-border hover:border-brand-300 hover:bg-muted/30",
          isAnalyzing && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-brand-100 rounded-full">
            <Upload className="h-8 w-8 text-brand-600" />
          </div>
          <div>
            <p className="font-semibold text-lg">
              {isDragActive ? "Drop your image here" : "Upload a food image"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              JPEG, PNG, or WEBP • Max 10MB
            </p>
          </div>
        </div>
      </div>

      {/* OR divider — OUTSIDE dropzone */}
      <div className="flex items-center gap-3 w-full max-w-xs mx-auto my-4">
        <div className="flex-1 h-px bg-border"></div>
        <span className="text-xs text-muted-foreground font-medium">OR</span>
        <div className="flex-1 h-px bg-border"></div>
      </div>

      {/* Camera button — OUTSIDE dropzone, no click conflict */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={handleCameraClick}
          disabled={isAnalyzing}
          className="gap-2"
        >
          <Camera className="h-4 w-4" />
          Take a Photo
        </Button>
      </div>
    </Card>
  );
}