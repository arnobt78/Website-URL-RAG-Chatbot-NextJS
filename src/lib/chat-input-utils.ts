/** Pure helpers for ChatInput submit guards (unit-testable). */
export function canSubmitChatInput(isLoading: boolean, input: string): boolean {
  return !isLoading && input.trim().length > 0;
}
