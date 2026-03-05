import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

/**
 * 파일을 Firebase Storage에 업로드하고 다운로드 URL을 반환
 * @param file 업로드할 파일
 * @param path Storage 경로 (예: "testimonials/avatar-123.jpg")
 * @returns 다운로드 URL
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}

/**
 * Firebase Storage에서 파일 삭제
 * @param path Storage 경로
 */
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

/**
 * 파일의 고유 Storage 경로 생성
 * @param folder 폴더명 (예: "testimonials")
 * @param fileName 원본 파일명
 * @returns 고유한 Storage 경로
 */
export function generateStoragePath(folder: string, fileName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = fileName.split(".").pop() || "jpg";
  return `${folder}/${timestamp}-${randomStr}.${extension}`;
}
