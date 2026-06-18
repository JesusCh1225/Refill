// "수원시" -> ["수원시", "수원"]처럼 "시"를 생략한 구어체 표기도 매칭 허용
export function wordVariants(word: string): string[] {
  return word.endsWith("시") && word.length > 1 ? [word, word.slice(0, -1)] : [word];
}
