export interface ITrack {
  id: string
  title: string
  artist: string
  image: string
  duration: string
}

export interface IMusicState {
  currentTrack: ITrack | null
  isPlaying: boolean
  queue: ITrack[]
}
