// Shared by the server page (schema price) and ProductView (the slider), so the
// price crawlers see is the one shown on load. Kept out of ProductView because
// a 'use client' module's functions can't be called on the server.

export function getPresetWeights(category?: string) {
  if (category === 'herbs' || category === 'spices') return [100, 200, 500, 1000]
  return [100, 250, 500, 1000]
}

export function getDefaultWeight(category?: string) {
  if (category === 'herbs' || category === 'spices') return 200
  return 250
}
