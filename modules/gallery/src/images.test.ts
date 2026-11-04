import { expect, test } from 'bun:test'
import { createImageQueue } from './images'
import { fitSlices } from './types'
test('portrait, landscape and square preserve source aspect and fit every pixel', () => {
  for (const [w,h] of [[4000,1000],[1000,4000],[2000,2000]]) {
    const fit = fitSlices(900,400,w!,h!)
    expect(fit.width / fit.height).toBeCloseTo(w! / h!,10)
    expect(fit.width+32).toBeLessThanOrEqual(900)
    expect(fit.height+40).toBeLessThanOrEqual(400)
  }
})
test('preview jumps queued thumbnails; obsolete images never decode; cached switch is immediate', async () => {
  const order:string[]=[]
  let release!: () => void
  const barrier = new Promise<void>(resolve => {release=resolve})
  const load = createImageQueue(async (_revision,id) => {order.push(id);if(id==='first')await barrier;return new Blob([id])})
  const first=load(1,'first',true)
  await Promise.resolve()
  const abort=new AbortController()
  const stale=load(1,'stale',true,abort.signal).catch(error=>error.name)
  const thumbnail=load(1,'thumbnail',true)
  const preview=load(1,'preview',false)
  abort.abort();release()
  await Promise.all([first,thumbnail,preview])
  expect(await stale).toBe('AbortError')
  expect(order).toEqual(['first','preview','thumbnail'])
  await load(1,'preview',false)
  expect(order.length).toBe(3)
})
