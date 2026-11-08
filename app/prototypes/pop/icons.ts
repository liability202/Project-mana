import { Candy, Clock4, Dumbbell, Laptop, Popcorn, Sunrise } from 'lucide-react'
import type { CravingIcon } from './data'

/** Icons for the craving tabs (plain module so both the server page and client tabs can use it). */
export const CRAVING_ICONS: Record<CravingIcon, typeof Clock4> = {
  clock: Clock4,
  dumbbell: Dumbbell,
  candy: Candy,
  laptop: Laptop,
  sunrise: Sunrise,
  popcorn: Popcorn,
}
