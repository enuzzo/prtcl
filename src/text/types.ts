export interface FontDefinition {
  family: string
  category: 'sans' | 'serif' | 'display' | 'handwriting' | 'mono'
  weights: number[]
  vibe: string
}

export interface TextConfig {
  text: string
  font: string
  weight: string
}
