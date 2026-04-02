import { Timestamp } from "firebase/firestore";

/**
 * 직렬화 후의 타입을 추론하기 위한 유틸리티 타입.
 * Timestamp나 toDate 메서드를 가진 객체는 number로 변환됨.
 */
export type SerializedFirestoreData<T> = T extends Timestamp
  ? number
  : T extends { toDate: () => Date }
  ? number
  : T extends Array<infer U>
  ? SerializedFirestoreData<U>[]
  : T extends object
  ? { [K in keyof T]: SerializedFirestoreData<T[K]> }
  : T;

/**
 * Server Component에서 Client Component로 데이터를 넘길 때 
 * Firebase Timestamp와 같은 non-plain object를 plain object로 직렬화하는 유틸리티
 */
export function serializeFirestoreData<T>(data: T): SerializedFirestoreData<T> {
  if (data === null || data === undefined) return data as unknown as SerializedFirestoreData<T>;

  // 배열인 경우 재귀적으로 처리
  if (Array.isArray(data)) {
    return data.map((item) => serializeFirestoreData(item)) as unknown as SerializedFirestoreData<T>;
  }

  // Firebase Timestamp 객체인 경우 (toDate 메서드가 있는 경우)
  if (data instanceof Timestamp || (typeof data === 'object' && 'toDate' in data && typeof (data as any).toDate === 'function')) {
    return (data as any).toMillis() as unknown as SerializedFirestoreData<T>;
  }

  // 일반 객체인 경우 모든 속성에 대해 재귀적으로 처리
  if (typeof data === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeFirestoreData(value);
    }
    return result as SerializedFirestoreData<T>;
  }

  return data as unknown as SerializedFirestoreData<T>;
}
