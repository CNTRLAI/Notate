export async function returnReasoningPrompt(
  data: {
    top_k: number;
    results: {
      content: string;
      metadata: string;
    }[];
  } | null,
  dataCollectionInfo: Collection | null
) {
  const reasoningPrompt =
    "You are a reasoning engine. Your task is to analyze the question and outline your step-by-step reasoning process for how to answer it. Keep your reasoning concise and focused on the key logical steps. Only return the reasoning process, do not provide the final answer." +
    (data
      ? "The following is the data that the user has provided via their custom data collection: " +
        `\n\n${JSON.stringify(data)}` +
        `\n\nCollection/Store Name: ${dataCollectionInfo?.name}` +
        `\n\nCollection/Store Files: ${dataCollectionInfo?.files}` +
        `\n\nCollection/Store Description: ${dataCollectionInfo?.description}` +
        `\n\n*** THIS IS THE END OF THE DATA COLLECTION ***`
      : "");
  return reasoningPrompt;
}
