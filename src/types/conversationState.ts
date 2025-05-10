export enum ConversationState {
  initial = 'initial',                  // 初回フォーム入力待ち
  gathering_details = 'gathering_details',  // 詳細を聞き出すフェーズ
  seeking_suggestions = 'seeking_suggestions',  // 教訓や提案を聞く終盤フェーズ
  summarizing = 'summarizing',          // 会話完了、要約フェーズ
}
