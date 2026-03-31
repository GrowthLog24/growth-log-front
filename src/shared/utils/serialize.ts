import { Timestamp } from "firebase/firestore";

/**
 * Server Component에서 Client Component로 데이터를 넘길 때 
 * Firebase Timestamp와 같은 non-plain object를 plain object로 직렬화하는 유틸리티
 */
export function serializeFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) return data;

  // 배열인 경우 재귀적으로 처리
  if (Array.isArray(data)) {
    return data.map((item) => serializeFirestoreData(item)) as unknown as T;
  }

  // Firebase Timestamp 객체인 경우 (toDate 메서드가 있는 경우)
  if (data instanceof Timestamp || (typeof data === 'object' && data !== null && 'toDate' in data && typeof (data as any).toDate === 'function')) {
    return (data as any).toMillis() as unknown as T;
  }

  // 일반 객체인 경우 모든 속성에 대해 재귀적으로 처리
  if (typeof data === "object" && data !== null) {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeFirestoreData(value);
    }
    return result as T;
  }

  return data;
}
