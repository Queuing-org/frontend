"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ROOM_THUMBNAIL_MAX_SIZE_BYTES = 6_000_000;
const ALLOWED_ROOM_THUMBNAIL_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "heic",
  "heif",
  "webp",
]);

export const ROOM_THUMBNAIL_ACCEPT =
  ".jpg,.jpeg,.png,.heic,.heif,.webp,image/jpeg,image/png,image/webp,image/heic,image/heif";

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop();
  return extension ? extension.toLowerCase() : "";
}

function validateRoomThumbnailFile(file: File) {
  const extension = getFileExtension(file.name);

  if (!ALLOWED_ROOM_THUMBNAIL_EXTENSIONS.has(extension)) {
    return "jpg, png, webp, heic 파일만 업로드할 수 있습니다.";
  }

  if (file.size > ROOM_THUMBNAIL_MAX_SIZE_BYTES) {
    return "파일이 6MB를 넘을 수 없습니다. 6MB 이하 파일로 다시 선택해주세요.";
  }

  return null;
}

export function useRoomThumbnailSelection() {
  const previewUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreviewUnavailable, setIsPreviewUnavailable] = useState(false);

  const revokePreviewUrl = useCallback(() => {
    if (!previewUrlRef.current) {
      return;
    }

    URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
  }, []);

  const clearSelection = useCallback(() => {
    revokePreviewUrl();
    setFile(null);
    setFileName(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    setIsPreviewUnavailable(false);
  }, [revokePreviewUrl]);

  const selectFile = useCallback(
    (files: FileList | null) => {
      const nextFile = files?.item(0) ?? null;

      if (!nextFile) {
        clearSelection();
        return;
      }

      const validationError = validateRoomThumbnailFile(nextFile);
      revokePreviewUrl();
      setIsPreviewUnavailable(false);

      if (validationError) {
        setFile(null);
        setFileName(null);
        setPreviewUrl(null);
        setErrorMessage(validationError);
        return;
      }

      const nextPreviewUrl = URL.createObjectURL(nextFile);
      previewUrlRef.current = nextPreviewUrl;
      setFile(nextFile);
      setFileName(nextFile.name);
      setPreviewUrl(nextPreviewUrl);
      setErrorMessage(null);
    },
    [clearSelection, revokePreviewUrl],
  );

  const markPreviewUnavailable = useCallback(() => {
    setIsPreviewUnavailable(true);
  }, []);

  useEffect(() => revokePreviewUrl, [revokePreviewUrl]);

  return {
    clearSelection,
    errorMessage,
    file,
    fileName,
    isPreviewUnavailable,
    markPreviewUnavailable,
    previewUrl,
    selectFile,
  };
}
