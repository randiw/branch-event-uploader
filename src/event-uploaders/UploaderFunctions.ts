import { excludedTopics } from "../utils/Config"

export function shouldUpload(filename: string, config: string): Boolean {
  const topics = excludedTopics(config).filter(topic => filename.indexOf(topic) >= 0)
  return topics.length === 0
}